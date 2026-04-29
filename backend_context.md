

### Path: src\auth\decorators\roles.decorator.ts ###

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);



### Path: src\auth\dto\login.dto.ts ###

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}



### Path: src\auth\guards\jwt-auth.guard.ts ###

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}



### Path: src\auth\guards\roles.guard.ts ###

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    // Assuming user gets attached by JwtStrategy
    return requiredRoles.some((role) => user?.role === role);
  }
}



### Path: src\auth\auth.controller.ts ###

import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    // Remove the password before returning the response
    const { password, ...result } = user;
    return result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user as any);
  }
}



### Path: src\auth\auth.module.ts ###

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'temporarySecretKey',
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }



### Path: src\auth\auth.service.ts ###

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}



### Path: src\auth\jwt.strategy.ts ###

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'temporarySecretKey',
    });
  }

  async validate(payload: any) {
    // This payload is the decoded JWT. What we return here gets injected into the request object.
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}



### Path: src\common\filters\http-exception.filter.ts ###

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    // Handle generic HttpExceptions (like 404, 400 Bad Request, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // Extract the message safely, particularly useful for class-validator arrays
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
      } else {
        message = exceptionResponse || exception.message;
      }
    } 
    // Handle specific TypeORM Exceptions
    else if (exception instanceof QueryFailedError) {
      const err = exception as any;
      if (err.code === 'ER_DUP_ENTRY') {
        status = HttpStatus.CONFLICT; // 409
        message = 'Conflict: Duplicate entry detected.';
      } else {
        message = 'Database query failed.';
      }
    } 
    // Standard unhandled javascript errors
    else if (exception instanceof Error) {
      message = exception.message;
    }

    // Contextual Logging Requirements
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception)
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - ${status} - ${JSON.stringify(message)}`);
    }

    // Standardized Payload Output
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}



### Path: src\common\interceptors\logging.interceptor.ts ###

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next
      .handle()
      .pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - now;
          this.logger.log(`[${method}] ${url} - ${response.statusCode} - ${delay}ms`);
        }),
      );
  }
}



### Path: src\destinations\dto\create-destination.dto.ts ###

import { IsString, IsArray, IsOptional, IsObject, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class DurationDto {
    @IsNumber()
    days: number;

    @IsNumber()
    nights: number;
}

export class CreateDestinationDto {
    @IsString()
    name: string;

    @IsString()
    image_url: string;

    @IsArray()
    @IsString({ each: true })
    mainCities: string[];

    @ValidateNested()
    @Type(() => DurationDto)
    duration: DurationDto;

    @IsString()
    departureFrom: string;

    @IsString()
    airline: string;

    @IsObject()
    flightDetails: Record<string, any>;

    @IsArray()
    @IsString({ each: true })
    highlights: string[];

    @IsString()
    mealPlan: string;

    @IsArray()
    @IsString({ each: true })
    included: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    notIncluded?: string[];

    @IsOptional()
    visaInfo?: Record<string, any> | string;

    @IsOptional()
    @IsArray()
    departureDates?: Record<string, any>[];

    @IsObject()
    pricing: Record<string, any>;

    @IsArray()
    @IsString({ each: true })
    keyAttractions: string[];
}



### Path: src\destinations\dto\update-destination.dto.ts ###

import { PartialType } from '@nestjs/mapped-types';
import { CreateDestinationDto } from './create-destination.dto';

export class UpdateDestinationDto extends PartialType(CreateDestinationDto) {}



### Path: src\destinations\entities\accommodation.entity.ts ###

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Destination } from './destination.entity';

@Entity('accommodations')
export class Accommodation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    hotel: string;

    @Column({ nullable: true })
    stars: number;

    @Column({ nullable: true })
    nights: number;

    // This links back to the main Destination table
    @ManyToOne(() => Destination, (destination) => destination.accommodations, {
        onDelete: 'CASCADE'
    })
    destination: Destination;
}


### Path: src\destinations\entities\destination.entity.ts ###

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Accommodation } from './accommodation.entity';
import { Itinerary } from './itinerary.entity';

@Entity('destinations')
export class Destination {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    image_url: string;

    @Column('simple-array')
    mainCities: string[];

    @Column('json')
    duration: { days: number; nights: number };

    @Column()
    departureFrom: string;

    @Column()
    airline: string;

    @Column('json')
    flightDetails: Record<string, any>;

    @Column('simple-array')
    highlights: string[];

    @Column()
    mealPlan: string;

    @Column('simple-array')
    included: string[];

    @Column('simple-array', { nullable: true })
    notIncluded: string[];

    @Column('json', { nullable: true })
    visaInfo: Record<string, any> | string;

    @Column('json', { nullable: true })
    departureDates: Record<string, any>[];

    @Column('json')
    pricing: Record<string, any>;

    @Column('simple-array')
    keyAttractions: string[];

    // --- Relationships ---

    @OneToMany(() => Accommodation, (accommodation) => accommodation.destination, {
        cascade: true // Automatically saves accommodations when saving a destination
    })
    accommodations: Accommodation[];

    @OneToMany(() => Itinerary, (itinerary) => itinerary.destination, {
        cascade: true
    })
    itineraries: Itinerary[];
}



### Path: src\destinations\entities\itinerary.entity.ts ###

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Destination } from './destination.entity';

@Entity('itineraries')
export class Itinerary {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    day: number;

    @Column()
    title: string;

    @ManyToOne(() => Destination, (destination) => destination.itineraries, {
        onDelete: 'CASCADE'
    })
    destination: Destination;
}


### Path: src\destinations\destinations.controller.ts ###

import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('api/destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) { }

  @Get()
  @UseInterceptors(CacheInterceptor) // Caches this static query
  findAll() {
    return this.destinationsService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  findOne(@Param('id') id: string) {
    return this.destinationsService.findOne(+id);
  }

  // AntiGravity's agents can easily expand these if you need full CRUD
  /*
  @Post()
  create(@Body() createDestinationDto: CreateDestinationDto) { ... }
  
  @Put(':id')
  update(@Param('id') id: string, @Body() updateDestinationDto: UpdateDestinationDto) { ... }
  
  @Delete(':id')
  remove(@Param('id') id: string) { ... }
  */
}


### Path: src\destinations\destinations.module.ts ###

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DestinationsService } from './destinations.service';
import { DestinationsController } from './destinations.controller';
import { Destination } from './entities/destination.entity';
import { Accommodation } from './entities/accommodation.entity';
import { Itinerary } from './entities/itinerary.entity';

@Module({
  // Register the entities here
  imports: [TypeOrmModule.forFeature([Destination, Accommodation, Itinerary])],
  controllers: [DestinationsController],
  providers: [DestinationsService],
})
export class DestinationsModule { }


### Path: src\destinations\destinations.service.ts ###

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destination } from './entities/destination.entity';

@Injectable()
export class DestinationsService {
  constructor(
    @InjectRepository(Destination)
    private readonly destinationRepository: Repository<Destination>,
  ) { }

  async findAll(): Promise<Destination[]> {
    return this.destinationRepository.find({
      relations: ['accommodations', 'itineraries'],
    });
  }

  async findOne(id: number): Promise<Destination> {
    const destination = await this.destinationRepository.findOne({
      where: { id },
      relations: ['accommodations', 'itineraries'],
    });

    if (!destination) {
      throw new NotFoundException(`Destination with ID ${id} not found`);
    }

    return destination;
  }
}


### Path: src\e-visas\dto\create-e-visa.dto.ts ###

import {
    IsString,
    IsArray,
    IsOptional,
    IsObject,
    IsNumber,
    ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

class DurationModeDto {
    @IsArray()
    @IsString({ each: true })
    duration: string[];

    @IsArray()
    @IsNumber({}, { each: true })
    price: number[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    demandeOccurrence?: string[];
}

export class CreateEVisaDto {
    @IsString()
    country: string;

    @IsString()
    flagUrl: string;

    // Optional because countries like China use durationMode instead
    @IsOptional()
    @IsNumber()
    price?: number;

    // Optional because countries like Oman use durationMode instead
    @IsOptional()
    @IsString()
    duration?: string;

    // Validates the nested object if it exists
    @IsOptional()
    @ValidateNested()
    @Type(() => DurationModeDto)
    durationMode?: DurationModeDto;

    @IsString()
    processingTime: string;

    // Bypassing strict class-validator here because your dataset 
    // mixes flat strings and arrays of strings for descriptions
    @IsOptional()
    description?: string | string[];

    @IsArray()
    @IsString({ each: true })
    requirements: string[];

    // Validates the dictionary structure (e.g., { "10 Jours": ["...", "..."] })
    @IsOptional()
    @IsObject()
    requirementsByDemande?: Record<string, string[]>;

    @IsString()
    constraints: string;
}


### Path: src\e-visas\dto\update-e-visa.dto.ts ###

import { PartialType } from '@nestjs/mapped-types';
import { CreateEVisaDto } from './create-e-visa.dto';

export class UpdateEVisaDto extends PartialType(CreateEVisaDto) {}



### Path: src\e-visas\entities\e-visa.entity.ts ###

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('e_visas')
export class EVisa {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    country: string;
    @Column()
    flagUrl: string;

    // Nullable because some use durationMode instead
    @Column({ type: 'int', nullable: true })
    price: number;

    // Nullable because some use durationMode instead
    @Column({ nullable: true })
    duration: string;

    // Stores objects like { duration: [], price: [], demandeOccurrence: [] }
    @Column('json', { nullable: true })
    durationMode: Record<string, any>;

    @Column()
    processingTime: string;

    // JSON because it can be a single string or an array of strings
    @Column('json')
    description: string | string[];

    @Column('json')
    requirements: string[];

    // Nullable because only countries like China and Oman have this
    @Column('json', { nullable: true })
    requirementsByDemande: Record<string, string[]>;

    // Using 'text' because some constraints are very long paragraphs
    @Column({ type: 'text' })
    constraints: string;
}


### Path: src\e-visas\e-visas.controller.ts ###

import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { EVisasService } from './e-visas.service';
import { CreateEVisaDto } from './dto/create-e-visa.dto';
import { UpdateEVisaDto } from './dto/update-e-visa.dto';

@Controller('api/e-visas')
export class EVisasController {
  constructor(private readonly eVisasService: EVisasService) { }

  @Post()
  create(@Body() createEVisaDto: CreateEVisaDto) {
    return this.eVisasService.create(createEVisaDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  findAll() {
    return this.eVisasService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  findOne(@Param('id') id: string) {
    return this.eVisasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEVisaDto: UpdateEVisaDto) {
    return this.eVisasService.update(+id, updateEVisaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eVisasService.remove(+id);
  }
}



### Path: src\e-visas\e-visas.module.ts ###

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EVisasService } from './e-visas.service';
import { EVisasController } from './e-visas.controller';
import { EVisa } from './entities/e-visa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EVisa])],
  controllers: [EVisasController],
  providers: [EVisasService],
})
export class EVisasModule { }


### Path: src\e-visas\e-visas.service.ts ###

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEVisaDto } from './dto/create-e-visa.dto';
import { UpdateEVisaDto } from './dto/update-e-visa.dto';
import { EVisa } from './entities/e-visa.entity';

@Injectable()
export class EVisasService {
  constructor(
    @InjectRepository(EVisa)
    private readonly eVisaRepository: Repository<EVisa>,
  ) {}

  async create(createEVisaDto: CreateEVisaDto): Promise<EVisa> {
    const eVisa = this.eVisaRepository.create(createEVisaDto as object);
    return await this.eVisaRepository.save(eVisa);
  }

  async findAll(): Promise<EVisa[]> {
    return await this.eVisaRepository.find();
  }

  async findOne(id: number): Promise<EVisa> {
    const eVisa = await this.eVisaRepository.findOne({ where: { id } });
    if (!eVisa) {
      throw new NotFoundException(`EVisa with ID ${id} not found`);
    }
    return eVisa;
  }

  async update(id: number, updateEVisaDto: UpdateEVisaDto): Promise<EVisa> {
    const eVisa = await this.findOne(id);
    Object.assign(eVisa, updateEVisaDto);
    return await this.eVisaRepository.save(eVisa);
  }

  async remove(id: number): Promise<void> {
    const eVisa = await this.findOne(id);
    await this.eVisaRepository.remove(eVisa);
  }
}



### Path: src\seed\seed.module.ts ###

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Destination } from '../destinations/entities/destination.entity';
import { Accommodation } from '../destinations/entities/accommodation.entity';
import { Itinerary } from '../destinations/entities/itinerary.entity';
import { EVisa } from '../e-visas/entities/e-visa.entity';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { SeedService } from './seed.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Destination, Accommodation, Itinerary, EVisa, Testimonial]),
    ],
    providers: [SeedService],
    exports: [SeedService],
})
export class SeedModule { }



### Path: src\seed\seed.service.ts ###

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destination } from '../destinations/entities/destination.entity';
import { Accommodation } from '../destinations/entities/accommodation.entity';
import { Itinerary } from '../destinations/entities/itinerary.entity';
import { EVisa } from '../e-visas/entities/e-visa.entity';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { destinations as staticDestinations } from '../static-data/destinationsData';
import { E_VisaData } from '../static-data/visaData';
import { testimonials } from '../static-data/testimonialsData';

@Injectable()
export class SeedService {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectRepository(Destination)
        private destinationRepository: Repository<Destination>,
        @InjectRepository(Accommodation)
        private accommodationRepository: Repository<Accommodation>,
        @InjectRepository(Itinerary)
        private itineraryRepository: Repository<Itinerary>,
        @InjectRepository(EVisa)
        private eVisaRepository: Repository<EVisa>,
        @InjectRepository(Testimonial)
        private testimonialRepository: Repository<Testimonial>,
    ) {}

    async seedDestinations() {
        this.logger.log('Starting destination seeding...');

        const currentCount = await this.destinationRepository.count();
        if (currentCount > 0) {
            this.logger.warn('Destinations already exist in the database. Seeding skipped to avoid duplicates.');
            return;
        }

        for (const data of staticDestinations) {
            const dest = new Destination();
            dest.name = data.name;
            dest.image_url = data.image_url;
            dest.mainCities = data.mainCities;
            dest.duration = data.duration;
            dest.departureFrom = data.departureFrom;
            dest.airline = data.airline;
            dest.flightDetails = data.flightDetails;
            dest.highlights = data.highlights;
            dest.mealPlan = data.mealPlan;
            dest.included = data.included;
            dest.notIncluded = data.notIncluded || [];
            dest.visaInfo = data.visaInfo as any;
            dest.departureDates = data.departureDates || [];
            dest.pricing = data.pricing;
            dest.keyAttractions = data.keyAttractions;

            if (data.accommodation) {
                dest.accommodations = data.accommodation.map((accInfo: any) => {
                    const acc = new Accommodation();
                    acc.location = accInfo.location;
                    acc.hotel = accInfo.hotel;
                    acc.stars = accInfo.stars;
                    acc.nights = accInfo.nights;
                    return acc;
                });
            }

            if (data.itinerary) {
                dest.itineraries = data.itinerary.map((itinInfo: any) => {
                    const iti = new Itinerary();
                    iti.day = itinInfo.day;
                    iti.title = itinInfo.title;
                    return iti;
                });
            }

            await this.destinationRepository.save(dest);
            this.logger.log(`Seeded destination: ${dest.name}`);
        }

        this.logger.log('Destination seeding complete!');
    }

    async seedVisas() {
        this.logger.log('Starting e-visa seeding...');

        const currentCount = await this.eVisaRepository.count();
        if (currentCount > 0) {
            this.logger.warn('E-Visas already exist in the database. Seeding skipped to avoid duplicates.');
            return;
        }

        for (const data of E_VisaData) {
            const evisa = new EVisa();
            evisa.country = data.country;
            evisa.flagUrl = data.flagUrl;
            evisa.processingTime = data.processingTime;
            evisa.description = data.description;
            evisa.requirements = data.requirements;
            evisa.constraints = data.constraints;

            if (data.price !== undefined) evisa.price = data.price;
            if (data.duration !== undefined) evisa.duration = data.duration;
            if (data.durationMode !== undefined) evisa.durationMode = data.durationMode;
            if (data.requirementsByDemande !== undefined) evisa.requirementsByDemande = data.requirementsByDemande as unknown as Record<string, string[]>;

            await this.eVisaRepository.save(evisa);
            this.logger.log(`Seeded e-visa for: ${evisa.country}`);
        }

        this.logger.log('E-Visa seeding complete!');
    }

    async seedTestimonials() {
        this.logger.log('Starting testimonial seeding...');

        const currentCount = await this.testimonialRepository.count();
        if (currentCount > 0) {
            this.logger.warn('Testimonials already exist in the database. Seeding skipped to avoid duplicates.');
            return;
        }

        for (const data of testimonials) {
            const testimonial = new Testimonial();
            testimonial.imageUrl = data.imageUrl;
            testimonial.name = data.name;
            testimonial.citation = data.citation;

            await this.testimonialRepository.save(testimonial);
            this.logger.log(`Seeded testimonial: ${testimonial.name}`);
        }

        this.logger.log('Testimonial seeding complete!');
    }
}



### Path: src\static-data\carouselData.ts ###

// src/data/carouselData.js

/**
 * Hero carousel slides for the homepage.
 * Supports both image and video (detected by extension in Carrousel.jsx).
 */
export const carouselImages = [
    {
        url: "/images/allezgo_banner.jpeg",
        alt: "banner_video",
    },
    {
        url: "/videos/banner.mp4",
        alt: "banner_video",
    },
    {
        url: "/images/slide9.jpeg",
        alt: "slide9",
    },
    {
        url: "/images/slide8.webp",
        alt: "Station balnÃ©aire de luxe avec palmiers et eau cristalline",
    },
    {
        url: "/images/slide7.webp",
        alt: "Station balnÃ©aire de luxe avec palmiers et eau cristalline",
    },
    {
        url: "/images/slide1.webp",
        alt: "Station balnÃ©aire de luxe avec palmiers et eau cristalline",
        title: "Le Paradis Tropical Vous Attend",
        subtitle:
            "DÃ©couvrez la dÃ©tente ultime dans nos stations balnÃ©aires 5 Ã©toiles exclusives Ã  Bali et aux Maldives",
    },
    {
        url: "/images/slide2.jpg",
        alt: "Station balnÃ©aire de luxe avec palmiers et eau cristalline",
        title: "Le Paradis Tropical Vous Attend",
        subtitle:
            "DÃ©couvrez la dÃ©tente ultime dans nos stations balnÃ©aires 5 Ã©toiles exclusives Ã  Bali et aux Maldives",
    },
    {
        url: "/images/slide4.jpg",
        alt: "Plage privÃ©e avec sable blanc, mer turquoise et hÃ´tel de luxe",
        title: "Plages PrivÃ©es de RÃªve",
        subtitle:
            "Profitez de plages exclusives et d'un service haut de gamme dans des cadres idylliques",
    },
    {
        url: "/images/slide5.jpg",
        alt: "Resort de luxe en bord de mer au coucher du soleil",
        title: "Couchers de Soleil Inoubliables",
        subtitle:
            "Admirez des panoramas spectaculaires depuis des hÃ´tels de luxe en bord d'ocÃ©an",
    },
    {
        url: "/images/slide6.jpg",
        alt: "Piscine de luxe face Ã  la mer dans un hÃ´tel haut de gamme",
        title: "DÃ©tente Absolue",
        subtitle:
            "Relaxez-vous dans des resorts de prestige offrant piscines, spas et vues marines exceptionnelles",
    },
];



### Path: src\static-data\destinationsData.ts ###

// src/data/destinationsData.js
// Fixes: currency "DA" â†’ "DZD" (ISO 4217), departureDates â†’ ISO YYYY-MM-DD format

export const destinations = [
    {
        id: 1,
        name: "AzerbaÃ¯djan",
        image_url: "/images/destinations/Azerbaijan.jpg",
        mainCities: ["Bakou", "Gabala"],
        duration: { days: 8, nights: 7 },
        departureFrom: "Alger",
        airline: "Turkish Airlines",
        flightDetails: { arrival: "morning", departure: "midday", via: "Istanbul" },
        highlights: [
            "E-visa assurÃ©, sans refus",
            "Destination moderne, sÃ»re et trÃ¨s apprÃ©ciÃ©e",
            "Plus de 15 groupes dÃ©jÃ  opÃ©rÃ©s",
            "Accompagnateur de l'agence + guide local arabophone",
        ],
        accommodation: [
            { location: "Bakou", hotel: "Iris Hotel", stars: 4, nights: 4 },
            { location: "Gabala", hotel: "Yengice Hotel", stars: 5, nights: 3 },
        ],
        mealPlan: "Petit dÃ©jeuner",
        included: [
            "Billetterie vols Turkish Airlines",
            "Visa Ã©lectronique",
            "Tous les transferts en bus touristique",
            "Excursions selon programme",
            "TÃ©lÃ©phÃ©rique Shahdag",
            "Accompagnateur de l'agence",
            "Guide local arabophone",
        ],
        pricing: {
            triple: 209000,
            double: 215000,
            single: 265000,
            child_under4: 109000,
            child_under12: 175000,
            second_child: 185000,
            infant: 35000,
            currency: "DZD",
        },
        keyAttractions: [
            "Bakou - capitale moderne UNESCO",
            "Gabala - montagnes du Caucase",
            "Sheki - Palais du Khan",
            "Shahdag - complexe de loisirs",
        ],
        itinerary: [
            { day: 1, title: "ArrivÃ©e Ã  Bakou & tour panoramique" },
            { day: 2, title: "Absheron & Bakou" },
            { day: 3, title: "Bakou - Gabala" },
            { day: 4, title: "Gabala - tÃ©lÃ©phÃ©rique et nature" },
            { day: 5, title: "Excursion Ã  Sheki" },
            { day: 6, title: "Gabala - Bakou" },
            { day: 7, title: "Shahdag" },
            { day: 8, title: "DÃ©part" },
        ],
    },
    {
        id: 2,
        name: "Liban",
        image_url: "/images/destinations/beirout.webp",
        mainCities: ["Beyrouth"],
        duration: { days: 8, nights: 7 },
        departureFrom: "Alger",
        airline: "Air AlgÃ©rie",
        flightDetails: {
            outbound: { departure: "08:00", arrival: "13:00" },
            return: { departure: "15:20", arrival: "17:50" },
            type: "Vol direct",
        },
        highlights: [
            "Vols directs optimaux",
            "HÃ´tels 100% garantis",
            "4 journÃ©es complÃ¨tes de visites guidÃ©es",
            "Guides francophones & arabophones",
        ],
        accommodation: [
            { hotel: "Vanda Boutique & Spa", stars: 4, nights: 7 },
            { hotel: "Portaluna Hotel & Resort", stars: 5, nights: 7 },
        ],
        mealPlan: "Petit dÃ©jeuner",
        included: [
            "Vols aller-retour Air AlgÃ©rie",
            "HÃ©bergement 7 nuits",
            "Petit-dÃ©jeuner quotidien",
            "Transferts aÃ©roport â†” hÃ´tel",
            "4 journÃ©es de visites guidÃ©es",
            "Bus climatisÃ©",
            "Guides francophones & arabophones",
            "Assistance permanente",
        ],
        notIncluded: [
            "Visa: 8$ Ã  l'arrivÃ©e",
            "DÃ©jeuners et dÃ®ners",
            "Tickets d'entrÃ©e aux sites",
        ],
        departureDates: [
            { outbound: "2025-12-23", return: "2025-12-30" },
            { outbound: "2026-01-02", return: "2026-01-09" },
            { outbound: "2026-01-16", return: "2026-01-23" },
        ],
        pricing: {
            hotel4Star: {
                name: "Vanda Boutique & Spa 4*",
                double: 139000,
                triple: 139000,
                single: 200000,
                infant: 25000,
                child_2to4: 88000,
                child_5to11: 125000,
            },
            hotel5Star: {
                name: "Portaluna Hotel & Resort 5*",
                double: 175000,
                triple: 175000,
                single: 245000,
                child_5to11: 139000,
            },
            currency: "DZD",
        },
        keyAttractions: [
            "Grotte de Jeita",
            "Harissa en tÃ©lÃ©phÃ©rique",
            "Byblos et Batroun",
            "Tripoli",
            "Palais de Beiteddine",
        ],
        itinerary: [
            { day: 1, title: "ArrivÃ©e Ã  Beyrouth" },
            { day: 2, title: "MusÃ©es, Grotte de Jeita, Harissa" },
            { day: 3, title: "Byblos et Batroun" },
            { day: 4, title: "JournÃ©e libre" },
            { day: 5, title: "Tripoli" },
            { day: 6, title: "Beyrouth et Chouf" },
            { day: 7, title: "JournÃ©e libre" },
            { day: 8, title: "DÃ©part" },
        ],
    },
    {
        id: 3,
        name: "Turquie",
        image_url: "/images/destinations/istanbull.webp",
        mainCities: ["Istanbul"],
        duration: { days: 8, nights: 7 },
        departureFrom: "Constantine",
        airline: "Turkish Airlines",
        flightDetails: { type: "Aller-retour" },
        highlights: [
            "Meilleure offre Ã  partir de 120 000 DA",
            "4 journÃ©es complÃ¨tes d'excursions touristiques",
            "DÃ©part de Constantine",
        ],
        accommodation: [
            { hotel: "NL Amsterdam", stars: 3, nights: 7 },
            { hotel: "Ozer Palace", stars: 4, nights: 7 },
            { hotel: "Ramada Plaza Sultanahmet", stars: 5, nights: 7 },
        ],
        mealPlan: "Petit dÃ©jeuner",
        included: [
            "Billet d'avion Turkish Airlines",
            "Transferts aÃ©roport/hÃ´tel/aÃ©roport",
            "HÃ©bergement selon formule choisie",
            "Petit-dÃ©jeuner quotidien",
            "4 journÃ©es d'excursions touristiques",
        ],
        notIncluded: ["Visa"],
        visaInfo: "Dossier Ã  dÃ©poser auprÃ¨s du centre Gateway",
        departureDates: [
            { outbound: "2026-01-08", return: "2026-01-15" },
            { outbound: "2026-01-15", return: "2026-01-22" },
            { outbound: "2026-01-22", return: "2026-01-29" },
            { outbound: "2026-01-24", return: "2026-01-31" },
            { outbound: "2026-01-29", return: "2026-02-05" },
            { outbound: "2026-02-05", return: "2026-02-12" },
            { outbound: "2026-02-07", return: "2026-02-14" },
            { outbound: "2026-02-09", return: "2026-02-16" },
        ],
        pricing: {
            hotel3Star: {
                name: "NL Amsterdam 3â˜…",
                double: 120000,
                single: 159000,
                child_6to12: 99000,
                child_2to5: 79000,
                infant: 25000,
            },
            hotel4Star: {
                name: "Ozer Palace 4â˜…",
                double: 128000,
                single: 166000,
                child_6to12: 105000,
                child_2to5: 80000,
                infant: 25000,
            },
            hotel5Star: {
                name: "Ramada Plaza Sultanahmet 5â˜…",
                double: 149000,
                single: 208000,
                child_6to12: 115000,
                child_2to5: 85000,
                infant: 25000,
            },
            currency: "DZD",
        },
        keyAttractions: [
            "MosquÃ©e Bleue",
            "Sainte-Sophie",
            "Grand Bazar",
            "CroisiÃ¨re ÃŽles des Princes",
            "Palais de Beylerbeyi",
            "Partie asiatique",
        ],
        itinerary: [
            { day: 1, title: "ArrivÃ©e et installation" },
            { day: 2, title: "City tour - MosquÃ©e Bleue, Sainte-Sophie, Grand Bazar" },
            { day: 3, title: "CroisiÃ¨re ÃŽles des Princes" },
            { day: 4, title: "OrtakÃ¶y et centres commerciaux" },
            { day: 5, title: "Partie asiatique - Beylerbeyi, ÃœskÃ¼dar" },
            { day: 6, title: "JournÃ©e libre" },
            { day: 7, title: "JournÃ©e libre" },
            { day: 8, title: "DÃ©part" },
        ],
    },
    {
        id: 4,
        name: "Russia",
        image_url: "/images/destinations/moscow.jpg",
        mainCities: ["Moscou"],
        duration: { days: 8, nights: 7 },
        departureFrom: "Alger",
        airline: "Air AlgÃ©rie",
        flightDetails: { type: "Vol direct" },
        highlights: [
            "Vol direct avec Air AlgÃ©rie",
            "HÃ´tel 4 Ã©toiles",
            "4 jours d'excursions incluses",
            "Guide francophone local",
        ],
        accommodation: [
            { hotel: "IZMAILOVO VEGA", stars: 4, nights: 7 },
        ],
        mealPlan: "Petit dÃ©jeuner",
        included: [
            "Billet d'avion aller-retour vol direct",
            "HÃ©bergement 7 nuitÃ©es",
            "Transferts aÃ©roport-hÃ´tel-aÃ©roport",
            "Assistance Ã  l'aÃ©roport",
            "Guide francophone local",
            "Toutes taxes de sÃ©jour",
            "4 jours d'excursions",
        ],
        visaInfo: {
            supplement: 15000,
            description: "Frais de visa + assurance voyage",
            documents: [
                "Passeport (validitÃ© 6 mois)",
                "2 photos",
                "Attestation de travail ou registre de commerce",
                "RelevÃ© de compte (min 1500 EUR / 300 000 DA)",
            ],
        },
        departureDates: [
            { outbound: "2026-01-16" },
        ],
        pricing: {
            hotel4Star: {
                name: "IZMAILOVO VEGA 4 Ã©toiles",
                double: 199000,
                triple: 199000,
                single: 249000,
                infant: 35000,
                child_2to4: 119000,
                child_5to11: 169000,
            },
            currency: "DZD",
            notes: "Chambres triples = doubles avec lit d'appoint. SupplÃ©ment visa: 15 000 DZD",
        },
        keyAttractions: [
            "MÃ©tro de Moscou",
            "Rue Arbat",
            "CathÃ©drale du Christ-Sauveur",
            "Place Rouge",
            "GUM",
            "Parc VDNKh",
            "MusÃ©e de l'espace",
            "Izmailovo Kremlin",
        ],
        itinerary: [
            { day: 1, title: "ArrivÃ©e et installation" },
            { day: 2, title: "MÃ©tro de Moscou et rue Arbat" },
            { day: 3, title: "Tour en bus - CathÃ©drale, UniversitÃ©, Moskva City" },
            { day: 4, title: "Place Rouge, GUM, shopping" },
            { day: 5, title: "VDNKh, MusÃ©e de l'espace, Izmailovo Kremlin" },
            { day: 6, title: "JournÃ©e libre" },
            { day: 7, title: "JournÃ©e libre" },
            { day: 8, title: "DÃ©part" },
        ],
    },
    {
        id: 5,
        name: "Ã‰gypte - Sharm El Sheikh & Le Caire",
        image_url: "/images/destinations/sharm.jpg",
        mainCities: ["Sharm El Sheikh", "Le Caire"],
        duration: { days: 8, nights: 7 },
        departureFrom: "Alger",
        airline: "EgyptAir",
        flightDetails: { type: "Vols internationaux et domestiques" },
        highlights: [
            "5 nuits Ã  Sharm El Sheikh en All Inclusive Soft",
            "2 nuits au Caire avec excursions",
            "DÃ®ner-croisiÃ¨re sur le Nil avec spectacle",
            "Lettre de garantie pour le visa incluse",
        ],
        accommodation: [
            { location: "Sharm El Sheikh", hotel: "Virginia Aqua Park", stars: 4, nights: 5 },
            { location: "Sharm El Sheikh", hotel: "Rehana Aqua Park", stars: 4, nights: 5 },
            { location: "Sharm El Sheikh", hotel: "Rehana Royal Beach", stars: 5, nights: 5 },
            { location: "Sharm El Sheikh", hotel: "Charmillion Club Aqua Park", stars: 5, nights: 5 },
            { location: "Sharm El Sheikh", hotel: "Charmillion Club Resort", stars: 5, nights: 5 },
            { location: "Le Caire", nights: 2 },
        ],
        mealPlan: "All Inclusive Soft Ã  Sharm / Petit dÃ©jeuner au Caire",
        included: [
            "Vols internationaux et domestiques EgyptAir",
            "Lettre de garantie pour le visa",
            "Transferts aÃ©roport-hÃ´tel-aÃ©roport",
            "HÃ©bergement 5 nuits Sharm (All Inclusive Soft)",
            "HÃ©bergement 2 nuits Le Caire (Petit dÃ©jeuner)",
            "Excursions Ã  Sharm El Sheikh",
            "Excursions au Caire",
            "DÃ®ner-croisiÃ¨re sur le Nil avec spectacle",
        ],
        notIncluded: [
            "Visa: 25 USD Ã  payer Ã  l'arrivÃ©e au Caire",
            "Nouveau MusÃ©e Ã‰gyptien (en option)",
        ],
        departureDates: [
            { outbound: "2026-01-16" },
            { outbound: "2026-01-23" },
            { outbound: "2026-02-01" },
        ],
        pricing: {
            hotel4Star: {
                name: "Virginia Aqua Park 4â˜…",
                double: 184000,
                triple: 182000,
                single: 220000,
                first_child: 115000,
                second_child: 145000,
                infant: 25000,
            },
            hotel5Star: {
                name: "Rehana Royal Beach 5â˜…",
                double: 222000,
                triple: 220000,
                single: 265000,
                first_child: 115000,
                second_child: 165000,
                infant: 25000,
            },
            currency: "DZD",
            notes: "Check-in Ã  14h00. CapacitÃ© chambres: 4 personnes max (2 adultes + 2 enfants)",
        },
        keyAttractions: [
            "Naama Bay", "Old Market Sharm", "MosquÃ©e Sahaba", "Soho Square",
            "Pyramides & Sphinx", "Khan El Khalili",
            "MosquÃ©es Al-Azhar & Al-Hussein", "CroisiÃ¨re sur le Nil",
        ],
        itinerary: [
            { day: 1, title: "ArrivÃ©e Ã  Sharm El Sheikh" },
            { day: 2, title: "Naama Bay et Old Market" },
            { day: 3, title: "MosquÃ©e Sahaba et Soho Square" },
            { day: 4, title: "DÃ©tente Ã  Sharm El Sheikh" },
            { day: 5, title: "JournÃ©e libre Ã  Sharm" },
            { day: 6, title: "Transfer au Caire - Pyramides & Sphinx" },
            { day: 7, title: "Khan El Khalili, MosquÃ©es, DÃ®ner-croisiÃ¨re Nil" },
            { day: 8, title: "DÃ©part" },
        ],
    },
    {
        id: 6,
        name: "Ã‰gypte - CroisiÃ¨re Louxor & Assouane",
        image_url: "/images/destinations/nile-cruise.jpg",
        mainCities: ["Le Caire", "Assouane", "Louxor", "Hurghada"],
        duration: { days: 9, nights: 9 },
        departureFrom: "Alger",
        airline: "EgyptAir",
        flightDetails: { type: "Vols internationaux et domestiques" },
        highlights: [
            "CroisiÃ¨re 5â˜… sur le Nil pendant 3 nuits",
            "DÃ©couverte de 4 villes emblÃ©matiques",
            "Programme culturel enrichi",
            "3 nuits All Inclusive Ã  Hurghada",
        ],
        accommodation: [
            { location: "Le Caire", hotel: "Marwa Palace", stars: 4, nights: 2 },
            { location: "Assouane", hotel: "Gloria Aqua Park", stars: 4, nights: 1 },
            { location: "CroisiÃ¨re Nil", hotel: "M/S Semiramis III", stars: 5, nights: 3 },
            { location: "Hurghada", hotel: "Amwaj Oyoun Club Resort", stars: 4, nights: 3 },
        ],
        mealPlan: "Petit dÃ©jeuner au Caire/Assouane, Pension complÃ¨te en croisiÃ¨re, All Inclusive Soft Ã  Hurghada",
        included: [
            "Vols internationaux et domestiques EgyptAir",
            "Tous les transferts aÃ©roport-hÃ´tel-aÃ©roport",
            "Transferts inter-villes (Louxor â†’ Hurghada)",
            "Lettre de garantie pour le visa",
            "HÃ©bergement selon programme",
            "Excursions complÃ¨tes dans les 4 villes",
            "EntrÃ©es et billets des sites inclus",
        ],
        notIncluded: [
            "Visa: 25 USD Ã  payer Ã  l'arrivÃ©e au Caire",
            "Boissons durant la croisiÃ¨re",
            "ActivitÃ©s optionnelles Ã  Hurghada (plongÃ©e, safari, spectacle dauphins)",
        ],
        pricing: {
            double: 275000,
            triple: 275000,
            single: 390000,
            first_child: 165000,
            second_child: 215000,
            infant: 25000,
            currency: "DZD",
        },
        keyAttractions: [
            "Pyramides & Sphinx", "Khan El Khalili",
            "Kom Ombo & MusÃ©e des Crocodiles", "Haut Barrage d'Assouane",
            "Temple de Philae", "ÃŽle Nubienne",
            "Temple de Karnak", "Temple de Louxor",
            "VallÃ©e des Rois", "Temple de la Reine Hatshepsout",
            "Colosses de Memnon", "Marina Port Hurghada",
        ],
        itinerary: [
            { day: 1, title: "ArrivÃ©e au Caire" },
            { day: 2, title: "Pyramides, Sphinx, Khan El Khalili, MosquÃ©es" },
            { day: 3, title: "Vol vers Assouane - Kom Ombo, Haut Barrage" },
            { day: 4, title: "Temple de Philae, ÃŽle Nubienne, embarquement croisiÃ¨re" },
            { day: 5, title: "Navigation sur le Nil" },
            { day: 6, title: "Louxor - Karnak, VallÃ©e des Rois, Hatshepsout" },
            { day: 7, title: "Transfert Ã  Hurghada" },
            { day: 8, title: "Hurghada - Marina Port et dÃ©tente" },
            { day: 9, title: "JournÃ©e libre Ã  Hurghada" },
            { day: 10, title: "DÃ©part" },
        ],
    },
];



### Path: src\static-data\index.ts ###

// src/data/index.js
// Barrel re-export â€” all existing imports like:
//   import { destinations } from '../data'
//   import { E_VisaData } from '../data/data.js'
// continue to work without any modification.

export { carouselImages }   from './carouselData';
export { testimonials }     from './testimonialsData';
export { destinations }     from './destinationsData';
export { E_VisaData }       from './visaData';



### Path: src\static-data\testimonialsData.ts ###

// src/data/testimonialsData.js

/**
 * Customer testimonials displayed in TestimonialsCarousel.jsx.
 * NOTE: Two entries currently share the name "Emily Rodriguez" â€”
 * these are placeholder entries that should be replaced with real reviews.
 */
export const testimonials = [
    {
        imageUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
        name: "Emily Rodriguez",
        citation:
            "Travailler avec cette Ã©quipe a Ã©tÃ© une expÃ©rience fantastique. Ils ont livrÃ© Ã  temps et ont dÃ©passÃ© nos attentes.",
    },
    {
        imageUrl: "/images/nizar-rond.png",
        name: "Ù†Ø²Ø§Ø± Ø¨Ù† Ù…Ø­Ù…Ø¯",
        citation:
            "ØµØ±Ø§Ø­Ø©Ù‹ ÙƒÙ„ Ø§Ù„Ø´ÙƒØ± Ù„Ù„Ø§Ø® Ø¹Ù…Ø§Ø¯ Ùˆ Ø§Ù„ÙØ±ÙŠÙ‚ Ù„Ù…Ø¹Ø§Ù‡. Ø®Ø¯Ù…Ø© Ø®Ù…Ø³ Ù†Ø¬ÙˆÙ… Ù„Ø­Ù‚ÙŠÙ‚Ø© ... Ù†ØªÙ…Ù†Ø§Ù„ÙƒÙ… ÙƒÙ„ Ø§Ù„ØªÙˆÙÙŠÙ‚ ÙˆØ§Ù„Ù†Ø¬Ø§Ø­.",
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
        name: "Emily Rodriguez", // TODO: replace with real testimonial
        citation:
            "Leur souci du dÃ©tail et leur communication claire ont rendu l'ensemble du processus fluide et sans stress.",
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
        name: "David Thompson",
        citation:
            "RÃ©sultats exceptionnels et excellente collaboration. Nous avons constatÃ© un impact rÃ©el dÃ¨s le premier jour.",
    },
];



### Path: src\static-data\visaData.ts ###

// src/data/visaData.js
// Fixes: all prices normalized to numbers (no formatted strings),
//        requirements alias added for requirementsByDemande entries.

export const E_VisaData = [
    {
        country: "Armenia",
        flagUrl: "/images/flags/flag-armenia.jpg",
        durationMode: {
            duration: ["21 Jours", "120 Jours"],
            price: [8500, 18500],
        },
        processingTime: "6-11 jours ouvrables",
        description:
            "E-Visa ARMENIA 21 Jours - 8.500,00 DZD / 1 Personne. Dossier: Scan passeport, scan photo (fichier source), billet TLX.",
        requirements: ["Scan passeport", "Scan photo (fichier source)", "Billet TLX"],
        constraints:
            "Pour Ã©viter les retards les documents doivent Ãªtre bien scannÃ©s. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit Ãªtre envoyÃ©e avant 15h. MERCI DE VÃ‰RIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÃ‡U, NOTRE AGENCE N'EST PAS RESPONSABLE DE PROBLÃˆME DE FAUTE NON RÃ‰CLAMÃ‰.",
    },
    {
        country: "Azerbaijan",
        flagUrl: "/images/flags/flag-azerbaijan.jpg",
        price: 14000,
        duration: "30 jours",
        processingTime: "5-8 jours",
        description:
            "Visa AzerbaÃ¯djan 30 jrs - 14.000,00 DZD / 1 Personne. Dossier Ã  fournir: Scan passeport, date exacte du dÃ©part.",
        requirements: ["Scan passeport", "Date exacte du dÃ©part"],
        constraints:
            "Pour Ã©viter les retards les documents doivent Ãªtre bien scannÃ©s. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit Ãªtre envoyÃ©e avant 15h. MERCI DE VÃ‰RIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÃ‡U, NOTRE AGENCE N'EST PAS RESPONSABLE DE PROBLÃˆME DE FAUTE NON RÃ‰CLAMÃ‰.",
    },
    {
        country: "China",
        flagUrl: "/images/flags/drapeau-de-la-chine.jpg",
        durationMode: {
            duration: ["30 jours"],
            demandeOccurrence: ["PremiÃ¨re Demande", "Renouvelement"],
            price: [15000, 12000],
        },
        processingTime: "environ 10 jours ouvrables",
        description: [
            "Visa Chine Sticker 30 jours 1ere demande - 15.000 DZD. Documents: Scan passeport, 1 photo Full HD, numÃ©ro de tÃ©lÃ©phone, attestation de travail ou RC, relevÃ© bancaire rÃ©cent (minimum 3.000â‚¬), casier judiciaire rÃ©cent.",
            "Visa Chine Sticker 30 jours renouvellement - 12.000 DZD. Documents: Scan passeport, 1 photo Full HD, numÃ©ro de tÃ©lÃ©phone, attestation de travail ou RC, copie du visa avec cachets, casier judiciaire rÃ©cent.",
        ],
        // Alias so validateVisaData passes â€” detailed requirements are in requirementsByDemande
        requirements: ["Scan passeport", "1 photo Full HD", "NumÃ©ro de tÃ©lÃ©phone", "Attestation de travail ou RC"],
        requirementsByDemande: {
            "PremiÃ¨re Demande": [
                "Scan passeport",
                "1 photo Full HD",
                "NumÃ©ro de tÃ©lÃ©phone",
                "Attestation de travail ou RC",
                "RelevÃ© bancaire rÃ©cent (minimum 3.000â‚¬)",
                "Casier judiciaire",
            ],
            "Renouvelement": [
                "Scan passeport",
                "1 photo Full HD",
                "NumÃ©ro de tÃ©lÃ©phone",
                "Attestation de travail ou RC",
                "Copie du visa avec cachet d'entrÃ©e et de sortie",
            ],
        },
        constraints:
            "Le demandeur doit Ãªtre prÃ©sent le jour du dÃ©pÃ´t. L'agence n'assume aucune responsabilitÃ© si le client achÃ¨te son billet avant l'obtention du visa. Ã€ partir du 1er aoÃ»t 2025, uniquement cartes bancaires algÃ©riennes via TPE. Merci d'envoyer le dossier au moins un mois avant la date de dÃ©part.",
    },
    {
        country: "Egypt",
        flagUrl: "/images/flags/drapeau-de-l-egypte.jpg",
        price: 2500,
        duration: "30 jours",
        processingTime: "24H Ã  48H",
        description:
            "Lettre de garantie Egypte - 2.500,00 DZD / 1 Personne. Dossier: Scan passeport, scan billet pour le Caire ou Charm el cheikh.",
        requirements: ["Scan passeport", "Scan billet pour le Caire ou Charm el cheikh"],
        constraints: "N/A",
    },
    {
        country: "Indonesia",
        flagUrl: "/images/flags/drapeau-de-l-indonesie.jpg",
        price: 29000,
        duration: "60 jours",
        processingTime: "8-10 jours ouvrables",
        description:
            "E-Visa IndonÃ©sie 60 jours - 29.000,00 DZD / 1 Personne. Dossier: Scan passeport, fichier source d'une photo.",
        requirements: ["Scan passeport", "Fichier source d'une photo (Ã  demander au photographe)"],
        constraints:
            "Pour Ã©viter les retards les documents doivent Ãªtre bien scannÃ©s. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit Ãªtre envoyÃ©e avant 15h.",
    },
    {
        country: "Lebanon",
        flagUrl: "/images/flags/flag-lebanon.jpg",
        price: 21000,
        duration: "30 jours",
        processingTime: "9 jours ouvrables",
        description:
            "Visa Liban Sticker 30 jours - 21.000,00 DZD / 1 Personne. Le dossier doit Ãªtre envoyÃ© Ã  l'agence Bright Sky Tour AIN BEIDA.",
        requirements: [
            "Passeport",
            "2 photo 5*5",
            "Acte de naissance",
            "Attestation de travail ou REG.C",
            "RelevÃ© de compte bancaire min 1500 euro",
        ],
        constraints:
            "Pour Ã©viter les retards les documents doivent Ãªtre bien scannÃ©s. Les refus des visas sont NON REMBOURSABLES.",
    },
    {
        country: "Oman",
        flagUrl: "/images/flags/drapeau-d-oman.jpg",
        durationMode: {
            duration: ["30 Jours", "10 Jours", "30 Jours Prolongation"],
            price: [22000, 14500, 35000],
        },
        processingTime: "4-8 jours ouvrables",
        description: [
            "E-Visa Oman 30 jours - 22.000,00 DZD / 1 Personne. Le client aura 8 jours seulement pour partir Ã  OMAN.",
            "E-Visa Oman 10 jours - 14.500,00 DZD / 1 Personne. Le client aura 8 jours seulement pour partir Ã  OMAN.",
            "E-Visa Oman 30 jours Prolongation - 35.000,00 DZD / 1 Personne.",
        ],
        // Alias for validateVisaData â€” detailed requirements are in requirementsByDemande
        requirements: ["Scan passeport", "Scan photo (fichier source)"],
        requirementsByDemande: {
            "30 Jours":            ["Scan passeport", "Scan photo (fichier source)"],
            "10 Jours":            ["Scan passeport", "Scan photo (fichier source)"],
            "30 Jours Prolongation": ["Scan passeport", "Scan photo (fichier source)", "Scan visa"],
        },
        constraints:
            "Les refus des visas sont NON REMBOURSABLES. Le client aura 8 jours seulement pour partir Ã  OMAN Ã  compter de la date d'effet du visa.",
    },
    {
        country: "Qatar",
        flagUrl: "/images/flags/drapeau-du-qatar.jpg",
        price: 9500,
        duration: "30 jours",
        processingTime: "3-6 jours ouvrables",
        description:
            "E-Visa Qatar 30 jours touristique - 9.500,00 DZD / 1 Personne. Visa sans assurance (l'assurance est souvent demandÃ©e Ã  l'aÃ©roport).",
        requirements: ["Scan passeport", "Fichier source photo", "Adresse mail avec mot de passe"],
        constraints:
            "Merci de ne pas ouvrir les emails pendant la durÃ©e du traitement. Les refus des visas sont NON REMBOURSABLES.",
    },
    {
        country: "Tanzania",
        flagUrl: "/images/flags/flag-tanzania.jpg",
        price: 20000,
        duration: "30 jours",
        processingTime: "7 jours ouvrables",
        description:
            "E-Visa Tanzanie (Zanzibar) 30 jours - 20.000,00 DZD / 1 Personne.",
        requirements: ["Scan passeport", "Scan photo (fichier source)", "Billet non confirmÃ©"],
        constraints:
            "Les refus des visas sont NON REMBOURSABLES. La demande doit Ãªtre envoyÃ©e avant 15h.",
    },
    {
        country: "Thailand",
        flagUrl: "/images/flags/drapeau-de-la-thailande.jpg",
        price: 19000,
        duration: "60 jours",
        processingTime: "30 jours ouvrables",
        description:
            "E-Visa Thailande 60 jours - 19.000,00 DZD / 1 Personne.",
        requirements: [
            "Scan passeport (JPEG)",
            "Photo fond blanc (fichier source)",
            "Attestation de travail ou RC",
            "RÃ©sidence moins de 2 mois (FR + AR)",
            "RelevÃ© de compte 1000 EUR",
        ],
        constraints:
            "Les fichiers CAM SCAN ne sont pas acceptÃ©s. Le dÃ©lai officiel au consulat est un mois â€” toute demande pour un dÃ©part date proche risque d'Ãªtre refusÃ©e.",
    },
    {
        country: "Turkey",
        flagUrl: "/images/flags/drapeau-de-la-turquie.jpg",
        price: 22000,
        duration: "B1",
        processingTime: "3 jours ouvrables",
        description:
            "E-Visa Turquie B1 - 22.000,00 DZD / 1 Personne. Dossier: Scan passeport, visa ou permis de sÃ©jour Schengen/UK/USA.",
        requirements: ["Scan passeport", "Visa ou permis de sÃ©jour Schengen/UK/USA"],
        constraints:
            "Visa disponible pour les personnes Ã¢gÃ©es de plus de 35 ans. Les refus des visas sont NON REMBOURSABLES.",
    },
    {
        country: "Vietnam",
        flagUrl: "/images/flags/flag-vietnam.jpg",
        price: 19500,
        duration: "30 jours",
        processingTime: "6-11 jours ouvrables",
        description:
            "E-Visa Vietnam 30 jours - 19.500,00 DZD / 1 Personne. En cas de fermeture du consulat, le dÃ©lai sera automatiquement allongÃ©.",
        requirements: ["Scan passeport", "Scan photo (fichier source)", "Billet d'avion"],
        constraints:
            "Les refus des visas sont NON REMBOURSABLES. Le client doit respecter le dÃ©lai de son visa pour Ã©viter les problÃ¨mes.",
    },
];



### Path: src\testimonials\dto\create-testimonial.dto.ts ###

import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class CreateTestimonialDto {
    @IsString()
    @IsNotEmpty()
    imageUrl: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    citation: string;
}



### Path: src\testimonials\dto\update-testimonial.dto.ts ###

import { PartialType } from '@nestjs/mapped-types';
import { CreateTestimonialDto } from './create-testimonial.dto';

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}



### Path: src\testimonials\entities\testimonial.entity.ts ###

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('testimonials')
export class Testimonial {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    imageUrl: string;

    @Column()
    name: string;

    @Column({ type: 'text' })
    citation: string;
}


### Path: src\testimonials\testimonials.controller.ts ###

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Controller('api/testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) { }

  @Post()
  create(@Body() createTestimonialDto: CreateTestimonialDto) {
    return this.testimonialsService.create(createTestimonialDto);
  }

  @Get()
  findAll() {
    return this.testimonialsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testimonialsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestimonialDto: UpdateTestimonialDto) {
    return this.testimonialsService.update(+id, updateTestimonialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testimonialsService.remove(+id);
  }
}



### Path: src\testimonials\testimonials.module.ts ###

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestimonialsService } from './testimonials.service';
import { TestimonialsController } from './testimonials.controller';
import { Testimonial } from './entities/testimonial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Testimonial])],
  controllers: [TestimonialsController],
  providers: [TestimonialsService],
})
export class TestimonialsModule {}



### Path: src\testimonials\testimonials.service.ts ###

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialRepository: Repository<Testimonial>,
  ) { }

  create(createTestimonialDto: CreateTestimonialDto) {
    const testimonial = this.testimonialRepository.create(createTestimonialDto as object);
    return this.testimonialRepository.save(testimonial);
  }

  findAll() {
    return this.testimonialRepository.find();
  }

  async findOne(id: number) {
    const testimonial = await this.testimonialRepository.findOne({ where: { id } });
    if (!testimonial) {
      throw new NotFoundException(`Testimonial with ID ${id} not found`);
    }
    return testimonial;
  }

  async update(id: number, updateTestimonialDto: UpdateTestimonialDto) {
    const testimonial = await this.findOne(id);
    Object.assign(testimonial, updateTestimonialDto);
    return this.testimonialRepository.save(testimonial);
  }

  async remove(id: number) {
    const testimonial = await this.findOne(id);
    return this.testimonialRepository.remove(testimonial);
  }
}



### Path: src\users\dto\create-user.dto.ts ###

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}



### Path: src\users\dto\update-user.dto.ts ###

import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}



### Path: src\users\entities\user.entity.ts ###

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
    ADMIN = 'admin',
    CLIENT = 'client',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    // We will store hashed passwords, never plain text!
    @Column()
    password: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CLIENT,
    })
    role: UserRole;

    @CreateDateColumn()
    createdAt: Date;

    // Future relation: @OneToMany(() => Booking, booking => booking.user)
    // bookings: Booking[];
}


### Path: src\users\users.controller.ts ###

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}



### Path: src\users\users.module.ts ###

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}



### Path: src\users\users.service.ts ###

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: UserRole.CLIENT,
    });

    return this.usersRepository.save(newUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    return this.usersRepository.remove(user);
  }
}



### Path: src\app.controller.ts ###

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}



### Path: src\app.module.ts ###

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DestinationsModule } from './destinations/destinations.module';
import { SeedModule } from './seed/seed.module';
import { EVisasModule } from './e-visas/e-visas.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // 1. Env Variables dynamically mapping
    ConfigModule.forRoot({ isGlobal: true }),

    // 2. Global Rate Limiter (100 hits per 60 seconds)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // 3. Global Caching
    CacheModule.register({
      isGlobal: true,
      ttl: 3600000 // default 1h caching 
    }),

    // 4. Secure TypeORM via ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // Safety: Disable synchronization in production to protect your live data
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),

    DestinationsModule,
    SeedModule,
    EVisasModule,
    TestimonialsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Enforces Rate limiting globally
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor, // Analytical delays tracking
    },
  ],
})
export class AppModule { }


### Path: src\app.service.ts ###

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}



### Path: src\main.ts ###

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable Global CORS restrictions safely
  // Restricting to your specific origins is better than '*'
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://allezgoo.com',
      'https://www.allezgoo.com'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. Protect with Helmet Headers (with Swagger CSP fix)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  }));

  // 3. Validation Enforcements & Auto Transformer
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));

  // 4. Uniform Exceptions
  app.useGlobalFilters(new HttpExceptionFilter());

  // 5. Build Dynamic Swagger Documentation Structure
  const config = new DocumentBuilder()
    .setTitle('Allez-Go Travel API')
    .setDescription('Full REST contract and authentication system for your React Frontend ecosystem.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Use the port provided by cPanel/Passenger
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();



### Path: package.json ###

{
  "name": "allez-go_backend",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/cache-manager": "^3.1.0",
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.4",
    "@nestjs/core": "^11.0.1",
    "@nestjs/jwt": "^11.0.2",
    "@nestjs/mapped-types": "*",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/swagger": "^11.3.0",
    "@nestjs/throttler": "^6.5.0",
    "@nestjs/typeorm": "^11.0.1",
    "bcrypt": "^6.0.0",
    "cache-manager": "^7.2.8",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.15.1",
    "helmet": "^8.1.0",
    "mysql2": "^3.22.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "typeorm": "^0.3.28"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.18.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/bcrypt": "^6.0.0",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^22.10.7",
    "@types/passport-jwt": "^4.0.1",
    "@types/supertest": "^6.0.2",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^16.0.0",
    "jest": "^30.0.0",
    "prettier": "^3.4.2",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.20.0"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}



### Path: nest-cli.json ###

{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}



### Path: tsconfig.json ###

{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "noFallthroughCasesInSwitch": false
  }
}



### Path: tsconfig.build.json ###

{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}


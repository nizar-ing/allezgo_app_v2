Path: package.json

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
    "migration:generate": "npx typeorm-ts-node-commonjs migration:generate -d src/config/typeorm-migration.config.ts",
    "migration:run": "npx typeorm-ts-node-commonjs migration:run -d src/config/typeorm-migration.config.ts",
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
    "@nestjs/platform-express": "^11.1.19",
    "@nestjs/serve-static": "^5.0.5",
    "@nestjs/swagger": "^11.3.0",
    "@nestjs/throttler": "^6.5.0",
    "@nestjs/typeorm": "^11.0.1",
    "bcrypt": "^6.0.0",
    "cache-manager": "^7.2.8",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.15.1",
    "helmet": "^8.1.0",
    "multer": "^2.1.1",
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
    "@types/multer": "^2.1.0",
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



---


Path: tsconfig.json

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



---


Path: nest-cli.json

{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}



---


Path: src\app.controller.ts

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('General')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check / Welcome message' })
  getHello(): string {
    return this.appService.getHello();
  }
}



---


Path: src\app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DestinationsModule } from './destinations/destinations.module';
import { SeedModule } from './seed/seed.module';
import { EVisasModule } from './e-visas/e-visas.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { BookingsModule } from './bookings/bookings.module';
import { CarouselModule } from './carousel/carousel.module';
import { SettingsModule } from './settings/settings.module';

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
        autoLoadEntities: true,
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
    BookingsModule,
    CarouselModule,
    SettingsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
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


---


Path: src\app.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}



---


Path: src\main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable Global CORS restrictions safely
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://allezgoo.com',
      'https://www.allezgoo.com'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // MUST include OPTIONS
    credentials: true,
  });

  // 2. Protect with Helmet Headers
  app.use(helmet({
    // 👇 THIS IS THE MAGIC FIX 👇
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https:`, `'unsafe-inline'`],
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
    // Define your environments so you can test the live URL directly
    .addServer('https://api.allezgoo.com/', 'Production Environment')
    .addServer('http://localhost:3000/', 'Local Development')
    // Configure precise JWT authentication for the visual portal
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token to interact with protected endpoints',
        in: 'header',
      },
      'jwt', // The security key name matching your controller decorators
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 6. Mount Swagger with advanced UI options
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'AllezGo API Documentation',
    swaggerOptions: {
      persistAuthorization: true, // Keeps your JWT active across page refreshes
      displayRequestDuration: true,
      filter: true, // Adds a search bar to quickly find specific endpoints
    },
  });

  // Use the port provided by cPanel/Passenger
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();


---


Path: src\auth\auth.controller.ts

import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    // Remove the password before returning the response
    const { password, ...result } = user;
    return result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return JWT' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const result = await this.authService.login(user as any);
    return result;
  }
}



---


Path: src\auth\auth.module.ts

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



---


Path: src\auth\auth.service.ts

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
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role, 
      firstName: user.firstName, 
      lastName: user.lastName 
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}



---


Path: src\auth\jwt.strategy.ts

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



---


Path: src\auth\decorators\roles.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);



---


Path: src\auth\dto\login-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'The JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}



---


Path: src\auth\dto\login.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'strongPassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}



---


Path: src\auth\guards\jwt-auth.guard.ts

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}



---


Path: src\auth\guards\roles.guard.ts

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

    // If no roles are required for this route, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // If there is no user attached to the request, or the user has no role, deny access
    if (!user || !user.role) {
      return false;
    }

    // Check if the user's role matches any of the required roles
    return requiredRoles.includes(user.role);
  }
}



---


Path: src\bookings\bookings.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  StreamableFile,
  NotFoundException,
  Res,
  Header,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import type { Response } from 'express';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(process.cwd(), 'uploads', 'receipts');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const randomName = uuidv4();
    cb(null, `${randomName}${extname(file.originalname)}`);
  },
});

@ApiTags('Bookings')
@Controller('api/bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('receipt', { storage }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new booking (Guest or Authenticated)' })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: 'Booking successfully submitted' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  async create(
    @Req() req: any,
    @UploadedFile() receipt: any,
    @Body('bookingData') bookingDataStr: string,
  ) {
    let userId = undefined;
    
    // Manually extract token to identify logged-in clients without blocking guests
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // Quick extraction of the JWT payload
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.id || payload.sub;
      } catch (e) {
        console.warn('Failed to parse JWT on public route');
      }
    }

    const bookingData = JSON.parse(bookingDataStr);
    const receiptFilename = receipt ? receipt.filename : null;

    const result = await this.bookingsService.create(userId, bookingData, receiptFilename);
    await this.cacheManager.clear();
    return result;
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve bookings for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMine(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.bookingsService.findByUserId(userId);
  }

  @Get()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve all bookings (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all system bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAll() {
    return this.bookingsService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a booking (status, externalId, etc.)' })
  @ApiResponse({ status: 200, description: 'Booking updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateData: { status?: string; externalId?: string },
  ) {
    const result = await this.bookingsService.update(+id, updateData);
    await this.cacheManager.clear();
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a booking (Admin only)' })
  @ApiParam({ name: 'id', description: 'The booking ID', example: '1' })
  @ApiResponse({ status: 200, description: 'Booking deleted successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async remove(@Param('id') id: string) {
    const result = await this.bookingsService.remove(+id);
    await this.cacheManager.clear();
    return result;
  }

  @Get('receipt/:filename')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download a payment receipt file (Admin only)' })
  @ApiParam({ name: 'filename', description: 'The name of the receipt file', example: 'abc-123.jpg' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getReceipt(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const filePath = join(process.cwd(), 'uploads', 'receipts', filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Receipt file not found');
    }
    const file = fs.createReadStream(filePath);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(file);
  }
}



---


Path: src\bookings\bookings.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking])],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}



---


Path: src\bookings\bookings.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async create(userId: number | undefined, bookingData: any, receiptFilename: string | null) {
    const reference = `ALG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Extract client phone — try top-level clientPhone first,
    // then fall back to the first passenger's phone inside bookingState.
    const clientPhone: string | null =
      bookingData.clientPhone ??
      bookingData.bookingState?.passengers?.[0]?.phone ??
      null;

    const newBooking = this.bookingRepository.create({
      reference,
      // Only link a user record when the request is authenticated.
      // Guest bookings leave the user relation as null.
      ...(userId ? { user: { id: userId } } : {}),
      hotelId: bookingData.hotelId,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      clientPrice: bookingData.clientPrice,
      iproPayload: bookingData.iproPayload,
      paymentMethod: bookingData.paymentMethod,
      receiptFilename,
      clientPhone,
      status: BookingStatus.PENDING,
    });

    return this.bookingRepository.save(newBooking);
  }

  async findAll() {
    return this.bookingRepository.find({
      relations: ['user'],
    });
  }

  async findByUserId(userId: number) {
    return this.bookingRepository.find({
      where: { user: { id: userId } },
      order: { id: 'DESC' }, // Assuming you want the newest bookings first
    });
  }

  async update(id: number, updateData: { status?: string; externalId?: string }) {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      // Ensure NotFoundException exists at the top of the file
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (updateData.status) {
      booking.status = updateData.status as BookingStatus;
    }
    
    if (updateData.externalId) {
      booking.externalId = updateData.externalId;
    }

    return this.bookingRepository.save(booking);
  }

  async remove(id: number) {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    
    await this.bookingRepository.remove(booking);
    return { id, deleted: true };
  }
}



---


Path: src\bookings\dto\create-booking.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsNumber } from 'class-validator';

export class BookingDataDto {
  @ApiProperty({ description: 'The unique ID of the hotel being booked', example: 101 })
  @IsNumber()
  @IsNotEmpty()
  hotelId: number;

  @ApiProperty({ description: 'Check-in date', example: '2024-05-20' })
  @IsString()
  @IsNotEmpty()
  checkIn: string;

  @ApiProperty({ description: 'Check-out date', example: '2024-05-25' })
  @IsString()
  @IsNotEmpty()
  checkOut: string;

  @ApiProperty({ description: 'Total price for the client', example: 450.75 })
  @IsNumber()
  @IsNotEmpty()
  clientPrice: number;

  @ApiProperty({ description: 'Full payload from the iPro booking system', example: { sessionId: 'xyz', hotelCode: 'ABC' } })
  @IsObject()
  @IsNotEmpty()
  iproPayload: Record<string, any>;

  @ApiProperty({ description: 'The payment method used', example: 'Credit Card' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Client contact phone number', example: '+212600000000' })
  @IsString()
  @IsOptional()
  clientPhone?: string;

  @ApiPropertyOptional({ description: 'Optional nested booking state containing passenger info', example: { passengers: [{ firstName: 'John', phone: '+212600000000' }] } })
  @IsObject()
  @IsOptional()
  bookingState?: any;
}

export class CreateBookingDto {
  @ApiProperty({
    type: 'string',
    description: 'A JSON string representing the booking data (BookingDataDto)',
    example: '{"hotelId":101,"checkIn":"2024-05-20","checkOut":"2024-05-25","clientPrice":450.75,"iproPayload":{},"paymentMethod":"Credit Card"}',
  })
  bookingData: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Payment receipt file' })
  receipt?: any;
}



---


Path: src\bookings\dto\update-booking-status.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

export class UpdateBookingStatusDto {
  @ApiProperty({
    description: 'The new status of the booking',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: BookingStatus;
}



---


Path: src\bookings\entities\booking.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  AGENCE = 'AGENCE',
  VIREMENT = 'VIREMENT',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  reference: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  hotelId: number;

  @Column()
  checkIn: string;

  @Column()
  checkOut: string;

  @Column('decimal', { precision: 10, scale: 2 })
  clientPrice: number;

  @Column({ type: 'json' })
  iproPayload: any;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', nullable: true })
  receiptFilename: string | null;

  @Column({ type: 'varchar', nullable: true })
  clientPhone: string | null;

  @Column({ type: 'varchar', nullable: true })
  externalId: string | null;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;
}



---


Path: src\carousel\carousel-media.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('carousel_media')
export class CarouselMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  alt: string;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



---


Path: src\carousel\carousel.controller.ts

import { Controller, Get, Post, Patch, Delete, Body, Param, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CarouselService } from './carousel.service';
import { UploadCarouselDto } from './dto/upload-carousel.dto';
import { ReorderCarouselDto } from './dto/reorder-carousel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as fs from 'fs';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/carousel';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Invalid file type. Only jpg, jpeg, png, gif, and mp4 are allowed.'), false);
  }
};

@Controller('carousel')
export class CarouselController {
  constructor(private readonly carouselService: CarouselService) {}

  @Get()
  findAllActive() {
    return this.carouselService.findAllActive();
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { 
    storage, 
    fileFilter, 
    limits: { fileSize: 50 * 1024 * 1024 } 
  }))
  create(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadCarouselDto) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    return this.carouselService.create(file, dto);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard)
  reorder(@Body() dto: ReorderCarouselDto) {
    return this.carouselService.reorder(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.carouselService.remove(id);
  }
}



---


Path: src\carousel\carousel.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarouselService } from './carousel.service';
import { CarouselController } from './carousel.controller';
import { CarouselMedia } from './carousel-media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CarouselMedia])],
  controllers: [CarouselController],
  providers: [CarouselService],
})
export class CarouselModule {}



---


Path: src\carousel\carousel.service.ts

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CarouselMedia } from './carousel-media.entity';
import { UploadCarouselDto } from './dto/upload-carousel.dto';
import { ReorderCarouselDto } from './dto/reorder-carousel.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CarouselService {
  private readonly logger = new Logger(CarouselService.name);

  constructor(
    @InjectRepository(CarouselMedia)
    private carouselMediaRepository: Repository<CarouselMedia>,
    private dataSource: DataSource,
  ) {}

  async findAllActive(): Promise<CarouselMedia[]> {
    return this.carouselMediaRepository.find({
      where: { isActive: true },
      order: {
        displayOrder: 'ASC',
        createdAt: 'DESC',
      },
    });
  }

  async create(file: Express.Multer.File, dto: UploadCarouselDto): Promise<CarouselMedia> {
    const url = `/uploads/carousel/${file.filename}`;
    
    const media = this.carouselMediaRepository.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      url: url,
      alt: dto.alt,
      displayOrder: dto.displayOrder ? parseInt(dto.displayOrder, 10) : 0,
    });

    return this.carouselMediaRepository.save(media);
  }

  async reorder(dto: ReorderCarouselDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.items) {
        await manager.update(CarouselMedia, item.id, { displayOrder: item.displayOrder });
      }
    });
  }

  async remove(id: string): Promise<void> {
    const media = await this.carouselMediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Carousel media with ID ${id} not found`);
    }

    await this.carouselMediaRepository.remove(media);

    const filePath = path.join(__dirname, '..', '..', 'uploads', 'carousel', media.filename);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${filePath}`, error);
    }
  }
}



---


Path: src\carousel\dto\reorder-carousel.dto.ts

import { IsArray, IsInt, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderItemDto {
  @IsUUID()
  id: string;

  @IsInt()
  displayOrder: number;
}

export class ReorderCarouselDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}



---


Path: src\carousel\dto\upload-carousel.dto.ts

import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class UploadCarouselDto {
  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsNumberString()
  displayOrder?: string;
}



---


Path: src\common\filters\http-exception.filter.ts

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



---


Path: src\common\interceptors\logging.interceptor.ts

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



---


Path: src\config\typeorm-migration.config.ts

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { CarouselMedia } from '../carousel/carousel-media.entity';
import { Settings } from '../settings/entities/settings.entity';
// Import other entities here (Destination, etc.)

config(); // This loads your .env file

export default new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    // Explicitly list entities so the CLI cannot miss them
    entities: [Booking, User, CarouselMedia, Settings],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false,
});


---


Path: src\destinations\destinations.controller.ts

import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, HttpCode, UseInterceptors, Inject, UploadedFile, BadRequestException } from '@nestjs/common';
import { CacheInterceptor, CACHE_MANAGER } from '@nestjs/cache-manager';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import type { Cache } from 'cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

const destinationImageStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/destinations';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${extname(file.originalname)}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Invalid file type. Only jpg, png, webp, and gif are allowed.'), false);
  }
};

@ApiTags('Destinations')
@Controller('api/destinations')
export class DestinationsController {
  constructor(
    private readonly destinationsService: DestinationsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Retrieve all destinations' })
  @ApiResponse({ status: 200, description: 'List of all travel destinations' })
  findAll() {
    return this.destinationsService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Retrieve a single destination by ID' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the destination', example: '1' })
  @ApiResponse({ status: 200, description: 'Destination details' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  findOne(@Param('id') id: string) {
    return this.destinationsService.findOne(+id);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a destination image (Admin only)' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully', schema: { example: { url: '/uploads/destinations/uuid.jpg' } } })
  @UseInterceptors(FileInterceptor('file', {
    storage: destinationImageStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    return { url: `/uploads/destinations/${file.filename}` };
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new destination (Admin only)' })
  @ApiResponse({ status: 201, description: 'Destination successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async create(@Body() createDestinationDto: CreateDestinationDto) {
    const newDestination = await this.destinationsService.create(createDestinationDto);
    const result = await this.destinationsService.findOne(newDestination.id);
    await this.cacheManager.clear();
    return result;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a destination by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the destination', example: '1' })
  @ApiResponse({ status: 200, description: 'Destination successfully updated' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async update(@Param('id') id: string, @Body() updateDestinationDto: UpdateDestinationDto) {
    const result = await this.destinationsService.update(+id, updateDestinationDto);
    await this.cacheManager.clear();
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a destination by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the destination', example: '1' })
  @ApiResponse({ status: 200, description: 'Destination successfully deleted' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async remove(@Param('id') id: string) {
    const result = await this.destinationsService.remove(+id);
    await this.cacheManager.clear();
    return result;
  }
}


---


Path: src\destinations\destinations.module.ts

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


---


Path: src\destinations\destinations.service.ts

import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Destination } from './entities/destination.entity';
import { Accommodation } from './entities/accommodation.entity';
import { Itinerary } from './entities/itinerary.entity';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

@Injectable()
export class DestinationsService {
  constructor(
    @InjectRepository(Destination)
    private readonly destinationRepository: Repository<Destination>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async create(createDestinationDto: CreateDestinationDto): Promise<Destination> {
    const destination = this.destinationRepository.create(createDestinationDto);
    const result = await this.destinationRepository.save(destination);
    await this.cacheManager.clear();
    return result;
  }

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

  async update(id: number, updateDestinationDto: UpdateDestinationDto): Promise<Destination> {
    const destination = await this.findOne(id);

    const hasNewAccommodations = (updateDestinationDto as any).accommodations !== undefined;
    const hasNewItineraries = (updateDestinationDto as any).itineraries !== undefined;

    // "Safe Replace" logic: Prevent orphaned records
    if (hasNewAccommodations) {
      await this.destinationRepository.manager.delete(Accommodation, { destination: { id } });
    }
    if (hasNewItineraries) {
      await this.destinationRepository.manager.delete(Itinerary, { destination: { id } });
    }

    const updated = this.destinationRepository.merge(destination, updateDestinationDto);
    const result = await this.destinationRepository.save(updated);
    await this.cacheManager.clear();
    return result;
  }

  async remove(id: number): Promise<void> {
    const destination = await this.findOne(id);
    await this.destinationRepository.remove(destination);
    await this.cacheManager.clear();
  }
}


---


Path: src\destinations\dto\create-destination.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsObject, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class DurationDto {
    @ApiProperty({ description: 'Number of days', example: 8 })
    @IsNumber()
    days: number;

    @ApiProperty({ description: 'Number of nights', example: 7 })
    @IsNumber()
    nights: number;
}

class AccommodationDto {
    @ApiPropertyOptional({ description: 'Location of the accommodation', example: 'Bangkok' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ description: 'Name of the hotel', example: 'Grand Hyatt' })
    @IsOptional()
    @IsString()
    hotel?: string;

    @ApiPropertyOptional({ description: 'Star rating of the hotel', example: 5 })
    @IsOptional()
    @IsNumber()
    stars?: number;

    @ApiPropertyOptional({ description: 'Number of nights at this accommodation', example: 3 })
    @IsOptional()
    @IsNumber()
    nights?: number;
}

class ItineraryDto {
    @ApiPropertyOptional({ description: 'Day number', example: 1 })
    @IsOptional()
    @IsNumber()
    day?: number;

    @ApiPropertyOptional({ description: 'Title of the itinerary for this day', example: 'Arrival and City Tour' })
    @IsOptional()
    @IsString()
    title?: string;
}

export class CreateDestinationDto {
    @ApiProperty({ description: 'Name of the destination', example: 'Thailand Paradise' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'URL of the main image', example: 'https://example.com/thailand.jpg' })
    @IsString()
    image_url: string;

    @ApiProperty({ description: 'Main cities visited', example: ['Bangkok', 'Phuket', 'Chiang Mai'] })
    @IsArray()
    @IsString({ each: true })
    mainCities: string[];

    @ApiProperty({ description: 'Duration details', type: DurationDto })
    @ValidateNested()
    @Type(() => DurationDto)
    duration: DurationDto;

    @ApiProperty({ description: 'Departure city', example: 'Casablanca' })
    @IsString()
    departureFrom: string;

    @ApiProperty({ description: 'Preferred airline', example: 'Royal Air Maroc' })
    @IsString()
    airline: string;

    @ApiProperty({ description: 'Detailed flight information', example: { outbound: 'AT200', inbound: 'AT201' } })
    @IsObject()
    flightDetails: Record<string, any>;

    @ApiProperty({ description: 'Key highlights of the trip', example: ['Visit Grand Palace', 'Phi Phi Island tour'] })
    @IsArray()
    @IsString({ each: true })
    highlights: string[];

    @ApiProperty({ description: 'Meal plan included', example: 'Half Board' })
    @IsString()
    mealPlan: string;

    @ApiProperty({ description: 'List of what is included in the price', example: ['Flights', 'Hotels', 'Transfers'] })
    @IsArray()
    @IsString({ each: true })
    included: string[];

    @ApiPropertyOptional({ description: 'List of what is NOT included in the price', example: ['Personal expenses', 'Tips'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    notIncluded?: string[];

    @ApiPropertyOptional({ description: 'Visa information details', example: 'Visa required for Moroccan citizens' })
    @IsOptional()
    visaInfo?: Record<string, any> | string;

    @ApiPropertyOptional({ 
        description: 'Available departure dates and prices', 
        example: [{ date: '2024-06-15', price: 12000 }] 
    })
    @IsOptional()
    @IsArray()
    departureDates?: Record<string, any>[];

    @ApiProperty({ description: 'Pricing details', example: { adult: 12500, child: 8500 } })
    @IsObject()
    pricing: Record<string, any>;

    @ApiProperty({ description: 'Key attractions to visit', example: ['Eiffel Tower', 'Louvre Museum'] })
    @IsArray()
    @IsString({ each: true })
    keyAttractions: string[];

    @ApiPropertyOptional({ description: 'Accommodation details', type: [AccommodationDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AccommodationDto)
    accommodations?: AccommodationDto[];

    @ApiPropertyOptional({ description: 'Detailed itinerary', type: [ItineraryDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItineraryDto)
    itineraries?: ItineraryDto[];
}


---


Path: src\destinations\dto\update-destination.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateDestinationDto } from './create-destination.dto';

export class UpdateDestinationDto extends PartialType(CreateDestinationDto) {}



---


Path: src\destinations\entities\accommodation.entity.ts

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


---


Path: src\destinations\entities\destination.entity.ts

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



---


Path: src\destinations\entities\itinerary.entity.ts

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


---


Path: src\e-visas\e-visas.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Inject } from '@nestjs/common';
import { CacheInterceptor, CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { EVisasService } from './e-visas.service';
import { CreateEVisaDto } from './dto/create-e-visa.dto';
import { UpdateEVisaDto } from './dto/update-e-visa.dto';

@ApiTags('E-Visas')
@Controller('api/e-visas')
export class EVisasController {
  constructor(
    private readonly eVisasService: EVisasService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new e-visa country entry' })
  @ApiResponse({ status: 201, description: 'E-visa entry successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() createEVisaDto: CreateEVisaDto) {
    const result = await this.eVisasService.create(createEVisaDto);
    await this.cacheManager.clear();
    return result;
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Retrieve all e-visa country entries' })
  @ApiResponse({ status: 200, description: 'List of all supported countries for e-visas' })
  findAll() {
    return this.eVisasService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Retrieve a single e-visa entry by ID' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the e-visa entry', example: '1' })
  @ApiResponse({ status: 200, description: 'E-visa entry details' })
  @ApiResponse({ status: 404, description: 'E-visa entry not found' })
  findOne(@Param('id') id: string) {
    return this.eVisasService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an e-visa entry by ID' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the e-visa entry', example: '1' })
  @ApiResponse({ status: 200, description: 'E-visa entry successfully updated' })
  @ApiResponse({ status: 404, description: 'E-visa entry not found' })
  async update(@Param('id') id: string, @Body() updateEVisaDto: UpdateEVisaDto) {
    const result = await this.eVisasService.update(+id, updateEVisaDto);
    await this.cacheManager.clear();
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an e-visa entry by ID' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the e-visa entry', example: '1' })
  @ApiResponse({ status: 200, description: 'E-visa entry successfully deleted' })
  @ApiResponse({ status: 404, description: 'E-visa entry not found' })
  async remove(@Param('id') id: string) {
    const result = await this.eVisasService.remove(+id);
    await this.cacheManager.clear();
    return result;
  }
}



---


Path: src\e-visas\e-visas.module.ts

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


---


Path: src\e-visas\e-visas.service.ts

import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CreateEVisaDto } from './dto/create-e-visa.dto';
import { UpdateEVisaDto } from './dto/update-e-visa.dto';
import { EVisa } from './entities/e-visa.entity';

@Injectable()
export class EVisasService {
  constructor(
    @InjectRepository(EVisa)
    private readonly eVisaRepository: Repository<EVisa>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createEVisaDto: CreateEVisaDto): Promise<EVisa> {
    const eVisa = this.eVisaRepository.create(createEVisaDto as object);
    const result = await this.eVisaRepository.save(eVisa);
    await this.cacheManager.clear();
    return result;
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
    const result = await this.eVisaRepository.save(eVisa);
    await this.cacheManager.clear();
    return result;
  }

  async remove(id: number): Promise<void> {
    const eVisa = await this.findOne(id);
    await this.eVisaRepository.remove(eVisa);
    await this.cacheManager.clear();
  }
}



---


Path: src\e-visas\dto\create-e-visa.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
    @ApiProperty({ description: 'List of available durations', example: ['30 Days', '90 Days'] })
    @IsArray()
    @IsString({ each: true })
    duration: string[];

    @ApiProperty({ description: 'List of prices corresponding to durations', example: [500, 1200] })
    @IsArray()
    @IsNumber({}, { each: true })
    price: number[];

    @ApiPropertyOptional({ description: 'Specific types of requests', example: ['Tourist', 'Business'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    demandeOccurrence?: string[];
}

export class CreateEVisaDto {
    @ApiProperty({ description: 'The country name', example: 'Saudi Arabia' })
    @IsString()
    country: string;

    @ApiProperty({ description: 'URL of the country flag', example: 'https://example.com/sa.svg' })
    @IsString()
    flagUrl: string;

    @ApiPropertyOptional({ description: 'Flat price if no duration mode is used', example: 1000 })
    @IsOptional()
    @IsNumber()
    price?: number;

    @ApiPropertyOptional({ description: 'Flat duration if no duration mode is used', example: '30 Days' })
    @IsOptional()
    @IsString()
    duration?: string;

    @ApiPropertyOptional({ description: 'Nested duration and price modes', type: DurationModeDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => DurationModeDto)
    durationMode?: DurationModeDto;

    @ApiProperty({ description: 'Standard processing time', example: '48-72 Hours' })
    @IsString()
    processingTime: string;

    @ApiPropertyOptional({ 
        description: 'Country description or specific notes', 
        example: 'Electronic visa for tourism and Umrah' 
    })
    @IsOptional()
    description?: string | string[];

    @ApiProperty({ 
        description: 'General requirements for the visa', 
        example: ['Passport copy', 'Personal photo'] 
    })
    @IsArray()
    @IsString({ each: true })
    requirements: string[];

    @ApiPropertyOptional({ 
        description: 'Specific requirements mapped by request type', 
        example: { 'Tourist': ['Passport'], 'Business': ['Passport', 'Invitation'] } 
    })
    @IsOptional()
    @IsObject()
    requirementsByDemande?: Record<string, string[]>;

    @ApiProperty({ description: 'Constraints or limitations', example: 'Single entry only' })
    @IsString()
    constraints: string;
}


---


Path: src\e-visas\dto\update-e-visa.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateEVisaDto } from './create-e-visa.dto';

export class UpdateEVisaDto extends PartialType(CreateEVisaDto) {}



---


Path: src\e-visas\entities\e-visa.entity.ts

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


---


Path: src\migrations\1777068667202-CreateBookingsTable.ts

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBookingsTable1777068667202 implements MigrationInterface {
    name = 'CreateBookingsTable1777068667202'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`bookings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`reference\` varchar(255) NOT NULL, \`hotelId\` int NOT NULL, \`checkIn\` varchar(255) NOT NULL, \`checkOut\` varchar(255) NOT NULL, \`clientPrice\` decimal(10,2) NOT NULL, \`iproPayload\` json NOT NULL, \`paymentMethod\` enum ('AGENCE', 'VIREMENT') NOT NULL, \`receiptFilename\` varchar(255) NULL, \`status\` enum ('PENDING', 'CONFIRMED', 'REJECTED') NOT NULL DEFAULT 'PENDING', \`userId\` int NULL, UNIQUE INDEX \`IDX_d7eca65f0a4d442ec4491f2f80\` (\`reference\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`bookings\` ADD CONSTRAINT \`FK_38a69a58a323647f2e75eb994de\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`bookings\` DROP FOREIGN KEY \`FK_38a69a58a323647f2e75eb994de\``);
        await queryRunner.query(`DROP INDEX \`IDX_d7eca65f0a4d442ec4491f2f80\` ON \`bookings\``);
        await queryRunner.query(`DROP TABLE \`bookings\``);
    }

}



---


Path: src\migrations\1777123265105-SyncBookingClientPhone.ts

import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncBookingClientPhone1777123265105 implements MigrationInterface {
    name = 'SyncBookingClientPhone1777123265105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`bookings\` ADD \`clientPhone\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`bookings\` DROP COLUMN \`clientPhone\``);
    }

}



---


Path: src\migrations\1777662340000-UpdateBookingStatusEnum.ts

import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBookingStatusEnum1777662340000 implements MigrationInterface {
    name = 'UpdateBookingStatusEnum1777662340000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Alter the enum to include CANCELLED
        await queryRunner.query(`ALTER TABLE \`bookings\` MODIFY COLUMN \`status\` ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to original enum
        await queryRunner.query(`ALTER TABLE \`bookings\` MODIFY COLUMN \`status\` ENUM('PENDING', 'CONFIRMED', 'REJECTED') NOT NULL DEFAULT 'PENDING'`);
    }
}



---


Path: src\migrations\1777663113000-AddExternalIdToBookings.ts

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExternalIdToBookings1777663113000 implements MigrationInterface {
    name = 'AddExternalIdToBookings1777663113000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`bookings\` ADD \`externalId\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`bookings\` DROP COLUMN \`externalId\``);
    }
}



---


Path: src\migrations\1778176785838-CarouselMedia.ts

import { MigrationInterface, QueryRunner } from "typeorm";

export class CarouselMedia1778176785838 implements MigrationInterface {
    name = 'CarouselMedia1778176785838'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`carousel_media\` (\`id\` varchar(36) NOT NULL, \`filename\` varchar(255) NOT NULL, \`originalName\` varchar(255) NOT NULL, \`mimeType\` varchar(255) NOT NULL, \`url\` varchar(255) NOT NULL, \`alt\` varchar(255) NULL, \`displayOrder\` int NOT NULL DEFAULT '0', \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`carousel_media\``);
    }

}



---


Path: src\migrations\1778500000000-CreateSettingsTable.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettingsTable1778500000000 implements MigrationInterface {
  name = 'CreateSettingsTable1778500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`settings\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`benefit_marge\` int NOT NULL DEFAULT 8,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`CHK_settings_benefit_marge\` CHECK (\`benefit_marge\` >= 0 AND \`benefit_marge\` <= 100)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO \`settings\` (\`id\`, \`benefit_marge\`) VALUES (1, 8)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`settings\``);
  }
}



---


Path: src\seed\seed.module.ts

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



---


Path: src\seed\seed.service.ts

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



---


Path: src\settings\settings.controller.ts

import { Controller, Get, Patch, Body, UseGuards, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Settings')
@ApiBearerAuth('jwt')
@Controller('api/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current application settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Current settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  findCurrent() {
    return this.settingsService.findCurrent();
  }

  @Patch()
  @ApiOperation({ summary: 'Update application settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid value' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async update(@Body() updateSettingsDto: UpdateSettingsDto) {
    const result = await this.settingsService.update(updateSettingsDto);
    await this.cacheManager.clear();
    return result;
  }
}



---


Path: src\settings\settings.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { Settings } from './entities/settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Settings])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}



---


Path: src\settings\settings.service.ts

import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Settings } from './entities/settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findCurrent(): Promise<Settings> {
    const settings = await this.settingsRepository.findOne({ where: { id: 1 } });
    if (!settings) {
      throw new NotFoundException('Settings record not found. Ensure the database migration has been run.');
    }
    return settings;
  }

  async update(updateSettingsDto: UpdateSettingsDto): Promise<Settings> {
    const settings = await this.findCurrent();
    Object.assign(settings, updateSettingsDto);
    const result = await this.settingsRepository.save(settings);
    await this.cacheManager.clear();
    return result;
  }
}



---


Path: src\settings\dto\update-settings.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({
    description: 'Business benefit margin percentage applied to pricing calculations',
    example: 8,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  benefit_marge: number;
}



---


Path: src\settings\entities\settings.entity.ts

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn()
  id: number;

  // Business benefit percentage applied to pricing calculations (0-100)
  @Column({ type: 'int', default: 8 })
  benefit_marge: number;
}



---


Path: src\static-data\carouselData.ts

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
        alt: "Station balnéaire de luxe avec palmiers et eau cristalline",
    },
    {
        url: "/images/slide7.webp",
        alt: "Station balnéaire de luxe avec palmiers et eau cristalline",
    },
    {
        url: "/images/slide1.webp",
        alt: "Station balnéaire de luxe avec palmiers et eau cristalline",
        title: "Le Paradis Tropical Vous Attend",
        subtitle:
            "Découvrez la détente ultime dans nos stations balnéaires 5 étoiles exclusives à Bali et aux Maldives",
    },
    {
        url: "/images/slide2.jpg",
        alt: "Station balnéaire de luxe avec palmiers et eau cristalline",
        title: "Le Paradis Tropical Vous Attend",
        subtitle:
            "Découvrez la détente ultime dans nos stations balnéaires 5 étoiles exclusives à Bali et aux Maldives",
    },
    {
        url: "/images/slide4.jpg",
        alt: "Plage privée avec sable blanc, mer turquoise et hôtel de luxe",
        title: "Plages Privées de Rêve",
        subtitle:
            "Profitez de plages exclusives et d'un service haut de gamme dans des cadres idylliques",
    },
    {
        url: "/images/slide5.jpg",
        alt: "Resort de luxe en bord de mer au coucher du soleil",
        title: "Couchers de Soleil Inoubliables",
        subtitle:
            "Admirez des panoramas spectaculaires depuis des hôtels de luxe en bord d'océan",
    },
    {
        url: "/images/slide6.jpg",
        alt: "Piscine de luxe face à la mer dans un hôtel haut de gamme",
        title: "Détente Absolue",
        subtitle:
            "Relaxez-vous dans des resorts de prestige offrant piscines, spas et vues marines exceptionnelles",
    },
];



---


Path: src\static-data\destinationsData.ts

// src/data/destinationsData.js
// Fixes: currency "DA" → "DZD" (ISO 4217), departureDates → ISO YYYY-MM-DD format

export const destinations = [
    {
        id: 1,
        name: "Azerbaïdjan",
        image_url: "/images/destinations/Azerbaijan.jpg",
        mainCities: ["Bakou", "Gabala"],
        duration: { days: 8, nights: 7 },
        departureFrom: "Alger",
        airline: "Turkish Airlines",
        flightDetails: { arrival: "morning", departure: "midday", via: "Istanbul" },
        highlights: [
            "E-visa assuré, sans refus",
            "Destination moderne, sûre et très appréciée",
            "Plus de 15 groupes déjà opérés",
            "Accompagnateur de l'agence + guide local arabophone",
        ],
        accommodation: [
            { location: "Bakou", hotel: "Iris Hotel", stars: 4, nights: 4 },
            { location: "Gabala", hotel: "Yengice Hotel", stars: 5, nights: 3 },
        ],
        mealPlan: "Petit déjeuner",
        included: [
            "Billetterie vols Turkish Airlines",
            "Visa électronique",
            "Tous les transferts en bus touristique",
            "Excursions selon programme",
            "Téléphérique Shahdag",
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
            { day: 1, title: "Arrivée à Bakou & tour panoramique" },
            { day: 2, title: "Absheron & Bakou" },
            { day: 3, title: "Bakou - Gabala" },
            { day: 4, title: "Gabala - téléphérique et nature" },
            { day: 5, title: "Excursion à Sheki" },
            { day: 6, title: "Gabala - Bakou" },
            { day: 7, title: "Shahdag" },
            { day: 8, title: "Départ" },
        ],
    },
    {
        id: 2,
        name: "Liban",
        image_url: "/images/destinations/beirout.webp",
        mainCities: ["Beyrouth"],
        duration: { days: 8, nights: 7 },
        departureFrom: "Alger",
        airline: "Air Algérie",
        flightDetails: {
            outbound: { departure: "08:00", arrival: "13:00" },
            return: { departure: "15:20", arrival: "17:50" },
            type: "Vol direct",
        },
        highlights: [
            "Vols directs optimaux",
            "Hôtels 100% garantis",
            "4 journées complètes de visites guidées",
            "Guides francophones & arabophones",
        ],
        accommodation: [
            { hotel: "Vanda Boutique & Spa", stars: 4, nights: 7 },
            { hotel: "Portaluna Hotel & Resort", stars: 5, nights: 7 },
        ],
        mealPlan: "Petit déjeuner",
        included: [
            "Vols aller-retour Air Algérie",
            "Hébergement 7 nuits",
            "Petit-déjeuner quotidien",
            "Transferts aéroport ↔ hôtel",
            "4 journées de visites guidées",
            "Bus climatisé",
            "Guides francophones & arabophones",
            "Assistance permanente",
        ],
        notIncluded: [
            "Visa: 8$ à l'arrivée",
            "Déjeuners et dîners",
            "Tickets d'entrée aux sites",
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
            "Harissa en téléphérique",
            "Byblos et Batroun",
            "Tripoli",
            "Palais de Beiteddine",
        ],
        itinerary: [
            { day: 1, title: "Arrivée à Beyrouth" },
            { day: 2, title: "Musées, Grotte de Jeita, Harissa" },
            { day: 3, title: "Byblos et Batroun" },
            { day: 4, title: "Journée libre" },
            { day: 5, title: "Tripoli" },
            { day: 6, title: "Beyrouth et Chouf" },
            { day: 7, title: "Journée libre" },
            { day: 8, title: "Départ" },
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
            "Meilleure offre à partir de 120 000 DA",
            "4 journées complètes d'excursions touristiques",
            "Départ de Constantine",
        ],
        accommodation: [
            { hotel: "NL Amsterdam", stars: 3, nights: 7 },
            { hotel: "Ozer Palace", stars: 4, nights: 7 },
            { hotel: "Ramada Plaza Sultanahmet", stars: 5, nights: 7 },
        ],
        mealPlan: "Petit déjeuner",
        included: [
            "Billet d'avion Turkish Airlines",
            "Transferts aéroport/hôtel/aéroport",
            "Hébergement selon formule choisie",
            "Petit-déjeuner quotidien",
            "4 journées d'excursions touristiques",
        ],
        notIncluded: ["Visa"],
        visaInfo: "Dossier à déposer auprès du centre Gateway",
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
                name: "NL Amsterdam 3★",
                double: 120000,
                single: 159000,
                child_6to12: 99000,
                child_2to5: 79000,
                infant: 25000,
            },
            hotel4Star: {
                name: "Ozer Palace 4★",
                double: 128000,
                single: 166000,
                child_6to12: 105000,
                child_2to5: 80000,
                infant: 25000,
            },
            hotel5Star: {
                name: "Ramada Plaza Sultanahmet 5★",
                double: 149000,
                single: 208000,
                child_6to12: 115000,
                child_2to5: 85000,
                infant: 25000,
            },
            currency: "DZD",
        },
        keyAttractions: [
            "Mosquée Bleue",
            "Sainte-Sophie",
            "Grand Bazar",
            "Croisière Îles des Princes",
            "Palais de Beylerbeyi",
            "Partie asiatique",
        ],
        itinerary: [
            { day: 1, title: "Arrivée et installation" },
            { day: 2, title: "City tour - Mosquée Bleue, Sainte-Sophie, Grand Bazar" },
            { day: 3, title: "Croisière Îles des Princes" },
            { day: 4, title: "Ortaköy et centres commerciaux" },
            { day: 5, title: "Partie asiatique - Beylerbeyi, Üsküdar" },
            { day: 6, title: "Journée libre" },
            { day: 7, title: "Journée libre" },
            { day: 8, title: "Départ" },
        ],
    },
    {
        id: 4,
        name: "Russia",
        image_url: "/images/destinations/moscow.jpg",
        mainCities: ["Moscou"],
        duration: { days: 8, nights: 7 },
        departureFrom: "Alger",
        airline: "Air Algérie",
        flightDetails: { type: "Vol direct" },
        highlights: [
            "Vol direct avec Air Algérie",
            "Hôtel 4 étoiles",
            "4 jours d'excursions incluses",
            "Guide francophone local",
        ],
        accommodation: [
            { hotel: "IZMAILOVO VEGA", stars: 4, nights: 7 },
        ],
        mealPlan: "Petit déjeuner",
        included: [
            "Billet d'avion aller-retour vol direct",
            "Hébergement 7 nuitées",
            "Transferts aéroport-hôtel-aéroport",
            "Assistance à l'aéroport",
            "Guide francophone local",
            "Toutes taxes de séjour",
            "4 jours d'excursions",
        ],
        visaInfo: {
            supplement: 15000,
            description: "Frais de visa + assurance voyage",
            documents: [
                "Passeport (validité 6 mois)",
                "2 photos",
                "Attestation de travail ou registre de commerce",
                "Relevé de compte (min 1500 EUR / 300 000 DA)",
            ],
        },
        departureDates: [
            { outbound: "2026-01-16" },
        ],
        pricing: {
            hotel4Star: {
                name: "IZMAILOVO VEGA 4 étoiles",
                double: 199000,
                triple: 199000,
                single: 249000,
                infant: 35000,
                child_2to4: 119000,
                child_5to11: 169000,
            },
            currency: "DZD",
            notes: "Chambres triples = doubles avec lit d'appoint. Supplément visa: 15 000 DZD",
        },
        keyAttractions: [
            "Métro de Moscou",
            "Rue Arbat",
            "Cathédrale du Christ-Sauveur",
            "Place Rouge",
            "GUM",
            "Parc VDNKh",
            "Musée de l'espace",
            "Izmailovo Kremlin",
        ],
        itinerary: [
            { day: 1, title: "Arrivée et installation" },
            { day: 2, title: "Métro de Moscou et rue Arbat" },
            { day: 3, title: "Tour en bus - Cathédrale, Université, Moskva City" },
            { day: 4, title: "Place Rouge, GUM, shopping" },
            { day: 5, title: "VDNKh, Musée de l'espace, Izmailovo Kremlin" },
            { day: 6, title: "Journée libre" },
            { day: 7, title: "Journée libre" },
            { day: 8, title: "Départ" },
        ],
    },
    {
        id: 5,
        name: "Égypte - Sharm El Sheikh & Le Caire",
        image_url: "/images/destinations/sharm.jpg",
        mainCities: ["Sharm El Sheikh", "Le Caire"],
        duration: { days: 8, nights: 7 },
        departureFrom: "Alger",
        airline: "EgyptAir",
        flightDetails: { type: "Vols internationaux et domestiques" },
        highlights: [
            "5 nuits à Sharm El Sheikh en All Inclusive Soft",
            "2 nuits au Caire avec excursions",
            "Dîner-croisière sur le Nil avec spectacle",
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
        mealPlan: "All Inclusive Soft à Sharm / Petit déjeuner au Caire",
        included: [
            "Vols internationaux et domestiques EgyptAir",
            "Lettre de garantie pour le visa",
            "Transferts aéroport-hôtel-aéroport",
            "Hébergement 5 nuits Sharm (All Inclusive Soft)",
            "Hébergement 2 nuits Le Caire (Petit déjeuner)",
            "Excursions à Sharm El Sheikh",
            "Excursions au Caire",
            "Dîner-croisière sur le Nil avec spectacle",
        ],
        notIncluded: [
            "Visa: 25 USD à payer à l'arrivée au Caire",
            "Nouveau Musée Égyptien (en option)",
        ],
        departureDates: [
            { outbound: "2026-01-16" },
            { outbound: "2026-01-23" },
            { outbound: "2026-02-01" },
        ],
        pricing: {
            hotel4Star: {
                name: "Virginia Aqua Park 4★",
                double: 184000,
                triple: 182000,
                single: 220000,
                first_child: 115000,
                second_child: 145000,
                infant: 25000,
            },
            hotel5Star: {
                name: "Rehana Royal Beach 5★",
                double: 222000,
                triple: 220000,
                single: 265000,
                first_child: 115000,
                second_child: 165000,
                infant: 25000,
            },
            currency: "DZD",
            notes: "Check-in à 14h00. Capacité chambres: 4 personnes max (2 adultes + 2 enfants)",
        },
        keyAttractions: [
            "Naama Bay", "Old Market Sharm", "Mosquée Sahaba", "Soho Square",
            "Pyramides & Sphinx", "Khan El Khalili",
            "Mosquées Al-Azhar & Al-Hussein", "Croisière sur le Nil",
        ],
        itinerary: [
            { day: 1, title: "Arrivée à Sharm El Sheikh" },
            { day: 2, title: "Naama Bay et Old Market" },
            { day: 3, title: "Mosquée Sahaba et Soho Square" },
            { day: 4, title: "Détente à Sharm El Sheikh" },
            { day: 5, title: "Journée libre à Sharm" },
            { day: 6, title: "Transfer au Caire - Pyramides & Sphinx" },
            { day: 7, title: "Khan El Khalili, Mosquées, Dîner-croisière Nil" },
            { day: 8, title: "Départ" },
        ],
    },
    {
        id: 6,
        name: "Égypte - Croisière Louxor & Assouane",
        image_url: "/images/destinations/nile-cruise.jpg",
        mainCities: ["Le Caire", "Assouane", "Louxor", "Hurghada"],
        duration: { days: 9, nights: 9 },
        departureFrom: "Alger",
        airline: "EgyptAir",
        flightDetails: { type: "Vols internationaux et domestiques" },
        highlights: [
            "Croisière 5★ sur le Nil pendant 3 nuits",
            "Découverte de 4 villes emblématiques",
            "Programme culturel enrichi",
            "3 nuits All Inclusive à Hurghada",
        ],
        accommodation: [
            { location: "Le Caire", hotel: "Marwa Palace", stars: 4, nights: 2 },
            { location: "Assouane", hotel: "Gloria Aqua Park", stars: 4, nights: 1 },
            { location: "Croisière Nil", hotel: "M/S Semiramis III", stars: 5, nights: 3 },
            { location: "Hurghada", hotel: "Amwaj Oyoun Club Resort", stars: 4, nights: 3 },
        ],
        mealPlan: "Petit déjeuner au Caire/Assouane, Pension complète en croisière, All Inclusive Soft à Hurghada",
        included: [
            "Vols internationaux et domestiques EgyptAir",
            "Tous les transferts aéroport-hôtel-aéroport",
            "Transferts inter-villes (Louxor → Hurghada)",
            "Lettre de garantie pour le visa",
            "Hébergement selon programme",
            "Excursions complètes dans les 4 villes",
            "Entrées et billets des sites inclus",
        ],
        notIncluded: [
            "Visa: 25 USD à payer à l'arrivée au Caire",
            "Boissons durant la croisière",
            "Activités optionnelles à Hurghada (plongée, safari, spectacle dauphins)",
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
            "Kom Ombo & Musée des Crocodiles", "Haut Barrage d'Assouane",
            "Temple de Philae", "Île Nubienne",
            "Temple de Karnak", "Temple de Louxor",
            "Vallée des Rois", "Temple de la Reine Hatshepsout",
            "Colosses de Memnon", "Marina Port Hurghada",
        ],
        itinerary: [
            { day: 1, title: "Arrivée au Caire" },
            { day: 2, title: "Pyramides, Sphinx, Khan El Khalili, Mosquées" },
            { day: 3, title: "Vol vers Assouane - Kom Ombo, Haut Barrage" },
            { day: 4, title: "Temple de Philae, Île Nubienne, embarquement croisière" },
            { day: 5, title: "Navigation sur le Nil" },
            { day: 6, title: "Louxor - Karnak, Vallée des Rois, Hatshepsout" },
            { day: 7, title: "Transfert à Hurghada" },
            { day: 8, title: "Hurghada - Marina Port et détente" },
            { day: 9, title: "Journée libre à Hurghada" },
            { day: 10, title: "Départ" },
        ],
    },
];



---


Path: src\static-data\index.ts

// src/data/index.js
// Barrel re-export — all existing imports like:
//   import { destinations } from '../data'
//   import { E_VisaData } from '../data/data.js'
// continue to work without any modification.

export { carouselImages }   from './carouselData';
export { testimonials }     from './testimonialsData';
export { destinations }     from './destinationsData';
export { E_VisaData }       from './visaData';



---


Path: src\static-data\testimonialsData.ts

// src/data/testimonialsData.js

/**
 * Customer testimonials displayed in TestimonialsCarousel.jsx.
 * NOTE: Two entries currently share the name "Emily Rodriguez" —
 * these are placeholder entries that should be replaced with real reviews.
 */
export const testimonials = [
    {
        imageUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
        name: "Emily Rodriguez",
        citation:
            "Travailler avec cette équipe a été une expérience fantastique. Ils ont livré à temps et ont dépassé nos attentes.",
    },
    {
        imageUrl: "/images/nizar-rond.png",
        name: "نزار بن محمد",
        citation:
            "صراحةً كل الشكر للاخ عماد و الفريق لمعاه. خدمة خمس نجوم لحقيقة ... نتمنالكم كل التوفيق والنجاح.",
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
        name: "Emily Rodriguez", // TODO: replace with real testimonial
        citation:
            "Leur souci du détail et leur communication claire ont rendu l'ensemble du processus fluide et sans stress.",
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
        name: "David Thompson",
        citation:
            "Résultats exceptionnels et excellente collaboration. Nous avons constaté un impact réel dès le premier jour.",
    },
];



---


Path: src\static-data\visaData.ts

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
            "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N'EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ.",
    },
    {
        country: "Azerbaijan",
        flagUrl: "/images/flags/flag-azerbaijan.jpg",
        price: 14000,
        duration: "30 jours",
        processingTime: "5-8 jours",
        description:
            "Visa Azerbaïdjan 30 jrs - 14.000,00 DZD / 1 Personne. Dossier à fournir: Scan passeport, date exacte du départ.",
        requirements: ["Scan passeport", "Date exacte du départ"],
        constraints:
            "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N'EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ.",
    },
    {
        country: "China",
        flagUrl: "/images/flags/drapeau-de-la-chine.jpg",
        durationMode: {
            duration: ["30 jours"],
            demandeOccurrence: ["Première Demande", "Renouvelement"],
            price: [15000, 12000],
        },
        processingTime: "environ 10 jours ouvrables",
        description: [
            "Visa Chine Sticker 30 jours 1ere demande - 15.000 DZD. Documents: Scan passeport, 1 photo Full HD, numéro de téléphone, attestation de travail ou RC, relevé bancaire récent (minimum 3.000€), casier judiciaire récent.",
            "Visa Chine Sticker 30 jours renouvellement - 12.000 DZD. Documents: Scan passeport, 1 photo Full HD, numéro de téléphone, attestation de travail ou RC, copie du visa avec cachets, casier judiciaire récent.",
        ],
        // Alias so validateVisaData passes — detailed requirements are in requirementsByDemande
        requirements: ["Scan passeport", "1 photo Full HD", "Numéro de téléphone", "Attestation de travail ou RC"],
        requirementsByDemande: {
            "Première Demande": [
                "Scan passeport",
                "1 photo Full HD",
                "Numéro de téléphone",
                "Attestation de travail ou RC",
                "Relevé bancaire récent (minimum 3.000€)",
                "Casier judiciaire",
            ],
            "Renouvelement": [
                "Scan passeport",
                "1 photo Full HD",
                "Numéro de téléphone",
                "Attestation de travail ou RC",
                "Copie du visa avec cachet d'entrée et de sortie",
            ],
        },
        constraints:
            "Le demandeur doit être présent le jour du dépôt. L'agence n'assume aucune responsabilité si le client achète son billet avant l'obtention du visa. À partir du 1er août 2025, uniquement cartes bancaires algériennes via TPE. Merci d'envoyer le dossier au moins un mois avant la date de départ.",
    },
    {
        country: "Egypt",
        flagUrl: "/images/flags/drapeau-de-l-egypte.jpg",
        price: 2500,
        duration: "30 jours",
        processingTime: "24H à 48H",
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
            "E-Visa Indonésie 60 jours - 29.000,00 DZD / 1 Personne. Dossier: Scan passeport, fichier source d'une photo.",
        requirements: ["Scan passeport", "Fichier source d'une photo (à demander au photographe)"],
        constraints:
            "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h.",
    },
    {
        country: "Lebanon",
        flagUrl: "/images/flags/flag-lebanon.jpg",
        price: 21000,
        duration: "30 jours",
        processingTime: "9 jours ouvrables",
        description:
            "Visa Liban Sticker 30 jours - 21.000,00 DZD / 1 Personne. Le dossier doit être envoyé à l'agence Bright Sky Tour AIN BEIDA.",
        requirements: [
            "Passeport",
            "2 photo 5*5",
            "Acte de naissance",
            "Attestation de travail ou REG.C",
            "Relevé de compte bancaire min 1500 euro",
        ],
        constraints:
            "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES.",
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
            "E-Visa Oman 30 jours - 22.000,00 DZD / 1 Personne. Le client aura 8 jours seulement pour partir à OMAN.",
            "E-Visa Oman 10 jours - 14.500,00 DZD / 1 Personne. Le client aura 8 jours seulement pour partir à OMAN.",
            "E-Visa Oman 30 jours Prolongation - 35.000,00 DZD / 1 Personne.",
        ],
        // Alias for validateVisaData — detailed requirements are in requirementsByDemande
        requirements: ["Scan passeport", "Scan photo (fichier source)"],
        requirementsByDemande: {
            "30 Jours":            ["Scan passeport", "Scan photo (fichier source)"],
            "10 Jours":            ["Scan passeport", "Scan photo (fichier source)"],
            "30 Jours Prolongation": ["Scan passeport", "Scan photo (fichier source)", "Scan visa"],
        },
        constraints:
            "Les refus des visas sont NON REMBOURSABLES. Le client aura 8 jours seulement pour partir à OMAN à compter de la date d'effet du visa.",
    },
    {
        country: "Qatar",
        flagUrl: "/images/flags/drapeau-du-qatar.jpg",
        price: 9500,
        duration: "30 jours",
        processingTime: "3-6 jours ouvrables",
        description:
            "E-Visa Qatar 30 jours touristique - 9.500,00 DZD / 1 Personne. Visa sans assurance (l'assurance est souvent demandée à l'aéroport).",
        requirements: ["Scan passeport", "Fichier source photo", "Adresse mail avec mot de passe"],
        constraints:
            "Merci de ne pas ouvrir les emails pendant la durée du traitement. Les refus des visas sont NON REMBOURSABLES.",
    },
    {
        country: "Tanzania",
        flagUrl: "/images/flags/flag-tanzania.jpg",
        price: 20000,
        duration: "30 jours",
        processingTime: "7 jours ouvrables",
        description:
            "E-Visa Tanzanie (Zanzibar) 30 jours - 20.000,00 DZD / 1 Personne.",
        requirements: ["Scan passeport", "Scan photo (fichier source)", "Billet non confirmé"],
        constraints:
            "Les refus des visas sont NON REMBOURSABLES. La demande doit être envoyée avant 15h.",
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
            "Résidence moins de 2 mois (FR + AR)",
            "Relevé de compte 1000 EUR",
        ],
        constraints:
            "Les fichiers CAM SCAN ne sont pas acceptés. Le délai officiel au consulat est un mois — toute demande pour un départ date proche risque d'être refusée.",
    },
    {
        country: "Turkey",
        flagUrl: "/images/flags/drapeau-de-la-turquie.jpg",
        price: 22000,
        duration: "B1",
        processingTime: "3 jours ouvrables",
        description:
            "E-Visa Turquie B1 - 22.000,00 DZD / 1 Personne. Dossier: Scan passeport, visa ou permis de séjour Schengen/UK/USA.",
        requirements: ["Scan passeport", "Visa ou permis de séjour Schengen/UK/USA"],
        constraints:
            "Visa disponible pour les personnes âgées de plus de 35 ans. Les refus des visas sont NON REMBOURSABLES.",
    },
    {
        country: "Vietnam",
        flagUrl: "/images/flags/flag-vietnam.jpg",
        price: 19500,
        duration: "30 jours",
        processingTime: "6-11 jours ouvrables",
        description:
            "E-Visa Vietnam 30 jours - 19.500,00 DZD / 1 Personne. En cas de fermeture du consulat, le délai sera automatiquement allongé.",
        requirements: ["Scan passeport", "Scan photo (fichier source)", "Billet d'avion"],
        constraints:
            "Les refus des visas sont NON REMBOURSABLES. Le client doit respecter le délai de son visa pour éviter les problèmes.",
    },
];



---


Path: src\testimonials\testimonials.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UseGuards, Inject } from '@nestjs/common';
import { CacheInterceptor, CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Testimonials')
@Controller('api/testimonials')
export class TestimonialsController {
  constructor(
    private readonly testimonialsService: TestimonialsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new testimonial (Admin only)' })
  @ApiResponse({ status: 201, description: 'Testimonial successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async create(@Body() createTestimonialDto: CreateTestimonialDto) {
    const result = await this.testimonialsService.create(createTestimonialDto);
    await this.cacheManager.clear();
    return result;
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Retrieve all testimonials' })
  @ApiResponse({ status: 200, description: 'List of all customer testimonials' })
  findAll() {
    return this.testimonialsService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Retrieve a single testimonial by ID' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the testimonial', example: '1' })
  @ApiResponse({ status: 200, description: 'Testimonial details' })
  @ApiResponse({ status: 404, description: 'Testimonial not found' })
  findOne(@Param('id') id: string) {
    return this.testimonialsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a testimonial by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the testimonial', example: '1' })
  @ApiResponse({ status: 200, description: 'Testimonial successfully updated' })
  @ApiResponse({ status: 404, description: 'Testimonial not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async update(@Param('id') id: string, @Body() updateTestimonialDto: UpdateTestimonialDto) {
    const result = await this.testimonialsService.update(+id, updateTestimonialDto);
    await this.cacheManager.clear();
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a testimonial by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the testimonial', example: '1' })
  @ApiResponse({ status: 200, description: 'Testimonial successfully deleted' })
  @ApiResponse({ status: 404, description: 'Testimonial not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async remove(@Param('id') id: string) {
    const result = await this.testimonialsService.remove(+id);
    await this.cacheManager.clear();
    return result;
  }
}



---


Path: src\testimonials\testimonials.module.ts

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



---


Path: src\testimonials\testimonials.service.ts

import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Testimonial } from './entities/testimonial.entity';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialRepository: Repository<Testimonial>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async create(createTestimonialDto: CreateTestimonialDto) {
    const testimonial = this.testimonialRepository.create(createTestimonialDto as object);
    const result = await this.testimonialRepository.save(testimonial);
    await this.cacheManager.clear();
    return result;
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
    const result = await this.testimonialRepository.save(testimonial);
    await this.cacheManager.clear();
    return result;
  }

  async remove(id: number) {
    const testimonial = await this.findOne(id);
    const result = await this.testimonialRepository.remove(testimonial);
    await this.cacheManager.clear();
    return result;
  }
}



---


Path: src\testimonials\dto\create-testimonial.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTestimonialDto {
    @ApiProperty({
        description: 'URL of the author image',
        example: 'https://example.com/avatar.jpg',
    })
    @IsString()
    @IsNotEmpty()
    imageUrl: string;

    @ApiProperty({
        description: 'Name of the person giving the testimonial',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'The testimonial text or citation',
        example: 'AllezGo made our honeymoon absolutely magical!',
    })
    @IsString()
    @IsNotEmpty()
    citation: string;
}



---


Path: src\testimonials\dto\update-testimonial.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateTestimonialDto } from './create-testimonial.dto';

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}



---


Path: src\testimonials\entities\testimonial.entity.ts

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


---


Path: src\users\users.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UseGuards, Inject } from '@nestjs/common';
import { CacheInterceptor, CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async create(@Body() createUserDto: CreateUserDto) {
    const result = await this.usersService.create(createUserDto);
    await this.cacheManager.clear();
    return result;
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Retrieve all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Retrieve a single user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the user', example: '1' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the user', example: '1' })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const result = await this.usersService.update(+id, updateUserDto);
    await this.cacheManager.clear();
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the user', example: '1' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async remove(@Param('id') id: string) {
    const result = await this.usersService.remove(+id);
    await this.cacheManager.clear();
    return result;
  }
}



---


Path: src\users\users.module.ts

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



---


Path: src\users\users.service.ts

import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

    const result = await this.usersRepository.save(newUser);
    await this.cacheManager.clear();
    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role'] 
    });
  }

  findAll() {
    return this.usersRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt']
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt']
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    const result = await this.usersRepository.save(user);
    await this.cacheManager.clear();
    return result;
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    const result = await this.usersRepository.remove(user);
    await this.cacheManager.clear();
    return result;
  }
}



---


Path: src\users\dto\create-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The unique email address of the user',
    example: 'alice.smith@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The password for the account (minimum 6 characters)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'The first name of the user',
    example: 'Alice',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Smith',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}



---


Path: src\users\dto\update-user.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}



---


Path: src\users\entities\user.entity.ts

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


---



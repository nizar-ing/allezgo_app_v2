import React from "react";
import { FaQuoteLeft, FaQuoteRight } from "react-icons/fa";

function TestimonialCard({
  imageUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  name = "Person Two",
  citation = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  isActive = false,
}) {
  return (
    <figure
      className={`relative bg-white rounded-3xl shadow-xl transition-all duration-500 p-4 sm:p-6 md:p-8 pb-8 sm:pb-10 pt-24 sm:pt-28 w-[90vw] max-w-sm sm:w-80 md:w-96 mx-auto ${
        isActive ? "shadow-2xl" : "shadow-md"
      }`}
    >
      {/* Profile Image - Larger and more prominent */}
      <div className="absolute top-3 lg:-top-16 left-1/2 transform -translate-x-1/2 z-0">
        <div
          className={`relative transition-all duration-500 ${
            isActive ? "scale-100" : "scale-90"
          }`}
        >
          <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-[5px] sm:border-[6px] border-white shadow-xl overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50">
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center flex flex-col items-center mt-4 sm:mt-6">
        {/* Name - More prominent */}
        <h3
          className={`text-lg lg:text-2xl font-bold mt-2 mb-4 transition-colors duration-300 ${
            isActive ? "text-gray-700" : "text-gray-600"
          } relative z-10`}
        >
          {name}
        </h3>

        {/* Citation with Quotation Marks */}
        <blockquote className="relative px-4">
          {/* Opening Quote */}
          <FaQuoteLeft
            className={`text-4xl mb-4 transition-colors duration-300 ${
              isActive
                ? "text-orange-500 opacity-90"
                : "text-orange-400 opacity-60"
            }`}
          />

          {/* Citation Text - Better readability */}
          <p
            className={`text-sm md:text-base lg:text-lg leading-relaxed px-2 my-4 transition-colors duration-300 ${
              isActive ? "text-gray-700" : "text-gray-500"
            }`}
          >
            {citation}
          </p>

          {/* Closing Quote - Aligned to right */}
          <div className="flex justify-end">
            <FaQuoteRight
              className={`text-4xl mt-4 transition-colors duration-300 ${
                isActive
                  ? "text-orange-500 opacity-90"
                  : "text-orange-400 opacity-60"
              }`}
            />
          </div>
        </blockquote>
      </div>
    </figure>
  );
}

export default TestimonialCard;

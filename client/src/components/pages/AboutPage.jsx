import React from 'react'

export default function AboutPage() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">About Our Car Rental Service</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-gray-700 mb-4">
            Founded in 2010, our car rental service has been providing quality vehicles and exceptional customer service for over a decade. What started as a small local business has grown into a trusted name in the car rental industry, serving thousands of satisfied customers each year.
          </p>
          <p className="text-gray-700">
            Our journey has been driven by a passion for automobiles and a commitment to making car rentals accessible, affordable, and enjoyable for everyone.
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-700">
            Our mission is to provide our customers with a seamless and enjoyable car rental experience. We strive to offer a diverse fleet of well-maintained vehicles, competitive prices, and personalized service that exceeds expectations.
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Customer Satisfaction: We put our customers first in everything we do.</li>
            <li>Quality: We maintain our vehicles to the highest standards of safety and comfort.</li>
            <li>Integrity: We conduct our business with honesty and transparency.</li>
            <li>Innovation: We continuously seek ways to improve our services and adapt to changing needs.</li>
            <li>Sustainability: We are committed to reducing our environmental impact through eco-friendly practices.</li>
          </ul>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Why Choose Us?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Wide Selection of Vehicles</h3>
              <p className="text-gray-700">From economy cars to luxury vehicles, we have something for every need and budget.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Competitive Pricing</h3>
              <p className="text-gray-700">We offer transparent, affordable rates with no hidden fees.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Excellent Customer Service</h3>
              <p className="text-gray-700">Our friendly staff is always ready to assist you with any questions or concerns.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Convenient Locations</h3>
              <p className="text-gray-700">With multiple pickup and drop-off locations, we make it easy to rent a car wherever you are.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

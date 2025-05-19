import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function HomePage() {
    const [error, setError] = useState(null)

    const [cars, setCars] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCars()
    }, [])

    const fetchCars = async () => {
        try {
            setLoading(true)
            const response = await axios.get('http://localhost:5050/cars/')
            setCars(response.data.slice(0, 3))
            setLoading(false)
        } catch (err) {
            console.log(err)
            setError('Failed to fetch cars. Please try again later.')
            setLoading(false)
        }
    }
    if (loading) return <div className="text-center py-8">Loading...</div>

    return (
        <div className="bg-gray-100">
            {/* Hero Section */}
            <section className="bg-slate-600 text-white">
                <div className="container mx-auto px-4 py-32">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold mb-4">Welcome to Car Rental</h1>
                        <p className="text-xl mb-8">Find your perfect ride for any adventure</p>
                        <Link to="/cars" className="bg-white text-slate-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition duration-300">
                            Browse Cars
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured Cars Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-8">Featured Cars</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* You can replace these with actual car data */}
                        {cars.map((car) => (
    <div key={car._id} className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-200 w-full h-48 flex items-center justify-center">
            <h3 className="text-2xl font-bold text-gray-600">{car.make} {car.model}</h3>
        </div>
        <div className="p-4">
            <h3 className="font-bold text-xl mb-2">{car.make} {car.model}</h3>
            <p className="text-gray-600 mb-4">Year: {car.year}</p>
            <Link to={`/car/${car._id}`} className="text-slate-600 font-bold hover:underline">
                View Details
            </Link>
        </div>
    </div>
))}
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="bg-gray-800 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to hit the road?</h2>
                    <p className="text-xl mb-8">Book your car now and start your journey</p>
                    <Link to="/cars" className="bg-slate-600 text-white px-6 py-3 rounded-full font-bold hover:bg-slate-700 transition duration-300">
                        Rent a Car
                    </Link>
                </div>
            </section>
        </div>
    )
}

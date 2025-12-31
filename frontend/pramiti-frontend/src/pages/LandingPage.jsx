import React from 'react'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <section className="bg-center bg-no-repeat bg-[url('https://images.pexels.com/photos/7841415/pexels-photo-7841415.jpeg')] bg-gray-900 bg-blend-multiply">
      <div className="px-4 mx-auto max-w-screen-xl text-center py-24 lg:py-56">
        
        {/* Title */}
        <h1 className="mb-8 text-3xl font-extrabold tracking-tight leading-none text-white md:text-4xl lg:text-5xl">
          <span className="text-violet-600">Pramiti</span> – AI Powered Clarity in Every Document
        </h1>

        {/* Sub-caption */}
        <p className="mb-8 text-lg font-normal text-gray-300 lg:text-lg sm:px-16 lg:px-48">
        A smart platform that empowers organizations to <span className="text-violet-600 font-semibold">manage documents</span>, enable employees to ask questions, get
          <span className="text-violet-600 font-semibold"> AI-generated answers, </span>
          track chat history, and gain insights for better knowledge management.
        </p>
        
        {/* Buttons */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0">
          
          {/* Patient Register */}
          <Link to="/register/organization" 
             className="inline-flex justify-center items-center py-3 px-6 text-base font-medium text-center 
                        text-white rounded-lg bg-violet-900 hover:bg-violet-950 
                        focus:ring-4 focus:ring-violet-300">
            Organization Register
          </Link>

          {/* Doctor Register */}
          <Link to="/register/user" 
             className="inline-flex justify-center items-center py-3 px-6 sm:ms-4 text-base font-medium 
                        text-center text-violet-900 bg-white rounded-lg border border-violet-900 
                        hover:bg-indigo-50 focus:ring-4 focus:ring-indigo-200">
            User Register
          </Link>  
        </div>

        {/* Already a user? Log in */}
        <p className="mt-8 text-gray-300 text-sm">
          Already a user?{" "}
          <a href="/login" className="text-violet-400 font-medium hover:underline">
            Log In
          </a>
        </p>
      </div>
    </section>
  )
}

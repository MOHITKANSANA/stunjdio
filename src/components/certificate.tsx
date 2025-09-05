"use client";

import React from 'react';
import { Award } from 'lucide-react';

interface CertificateProps {
  studentName: string;
  courseName: string;
  score: number;
  date: string;
}

const Certificate: React.FC<CertificateProps> = ({ studentName, courseName, score, date }) => {
  return (
    <div id="certificate" className="bg-white text-gray-800 p-8 rounded-lg shadow-2xl border-4 border-yellow-500 max-w-2xl mx-auto font-serif">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-yellow-600">Certificate of Completion</h1>
        
        <p className="text-lg">This is to certify that</p>
        
        <h2 className="text-3xl font-semibold text-blue-800 tracking-wider">{studentName}</h2>
        
        <p className="text-lg">has successfully completed the practice test for</p>
        
        <h3 className="text-2xl font-medium text-blue-700">{courseName}</h3>
        
        <p className="text-lg">with a score of</p>

        <p className="text-5xl font-bold text-green-700">{score.toFixed(0)}%</p>
        
        <div className="flex justify-between items-center pt-8">
            <div>
                <p className="text-sm border-t-2 border-gray-400 px-4 pt-1">Date</p>
                <p className="font-semibold">{date}</p>
            </div>
            <Award className="h-20 w-20 text-yellow-500" />
            <div>
                <p className="text-sm border-t-2 border-gray-400 px-4 pt-1">Signature</p>
                <p className="font-cursive text-xl">Go Swami Academy</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;

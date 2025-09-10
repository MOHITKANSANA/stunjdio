
"use client";

import React from 'react';
import { Award, CheckCircle, XCircle } from 'lucide-react';

interface CertificateProps {
  studentName: string;
  courseName: string;
  score: number;
  date: string;
  status?: 'pass' | 'fail' | string;
}

const Certificate: React.FC<CertificateProps> = ({ studentName, courseName, score, date, status }) => {
  const isPass = status === 'pass' || (status === undefined && score >= 40); // Default pass mark is 40% if status is not provided

  return (
    <div id="certificate" className="bg-white text-gray-800 p-8 rounded-lg shadow-2xl border-4 border-yellow-500 w-full max-w-2xl mx-auto font-serif">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-yellow-600">{isPass ? 'Certificate of Achievement' : 'Participation Certificate'}</h1>
        
        <p className="text-lg">This is to certify that</p>
        
        <h2 className="text-3xl font-semibold text-blue-800 tracking-wider break-words">{studentName}</h2>
        
        <p className="text-lg">has successfully participated in the</p>
        
        <h3 className="text-2xl font-medium text-blue-700 break-words">{courseName}</h3>
        
        <p className="text-lg">with a score of</p>

        <p className="text-5xl font-bold text-green-700">{score.toFixed(0)}%</p>

        {status && (
             <div className={`flex items-center justify-center gap-2 text-2xl font-bold ${isPass ? 'text-green-600' : 'text-red-600'}`}>
                {isPass ? <CheckCircle /> : <XCircle />}
                <span>Status: {status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
        )}
        
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


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
    <div id="certificate" className="bg-white text-gray-800 p-4 rounded-lg shadow-2xl border-4 border-yellow-500 w-full max-w-lg mx-auto font-serif relative overflow-hidden">
       <div className="absolute inset-0 bg-repeat bg-center opacity-5" style={{backgroundImage: 'url(/go-swami-logo.png)'}}></div>
       <div className="relative z-10 text-center space-y-1">
        <h1 className="text-xl font-bold text-yellow-600">{isPass ? 'Certificate of Achievement' : 'Participation Certificate'}</h1>
        
        <p className="text-xs">This is to certify that</p>
        
        <h2 className="text-lg font-semibold text-blue-800 tracking-wider break-words">{studentName}</h2>
        
        <p className="text-xs">has successfully participated in the</p>
        
        <h3 className="text-base font-medium text-blue-700 break-words">{courseName}</h3>
        
        <p className="text-xs">with a score of</p>

        <p className="text-2xl font-bold text-green-700">{score.toFixed(0)}%</p>

        {status && (
             <div className={`flex items-center justify-center gap-1 text-base font-bold ${isPass ? 'text-green-600' : 'text-red-600'}`}>
                {isPass ? <CheckCircle className="h-4 w-4"/> : <XCircle className="h-4 w-4"/>}
                <span>Status: {status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
        )}
        
        <div className="flex justify-between items-center pt-2">
            <div className='text-left'>
                <p className="text-[10px] border-t-2 border-gray-400 px-1 pt-1">Date</p>
                <p className="font-semibold text-[10px]">{date}</p>
            </div>
            <Award className="h-10 w-10 text-yellow-500" />
            <div className='text-right'>
                <p className="text-[10px] border-t-2 border-gray-400 px-1 pt-1">Signature</p>
                <p className="font-cursive text-base">Learn with Munedra</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;

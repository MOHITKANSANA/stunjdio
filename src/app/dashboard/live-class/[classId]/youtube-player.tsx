
'use client';

import React from 'react';

const YouTubePlayer = ({ videoId }: { videoId: string | null }) => {
    if (!videoId) {
        return (
            <div className="w-full aspect-video bg-black text-white flex items-center justify-center">
                <p>Invalid or unsupported YouTube video URL.</p>
            </div>
        );
    }

    return (
        <div className="w-full aspect-video">
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&controls=1&showinfo=0&modestbranding=1&iv_load_policy=3`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
            ></iframe>
        </div>
    );
};

export default YouTubePlayer;

import React from 'react';

export const QuranSkeleton: React.FC = () => {
    return (
        <div className="p-4 md:p-8 flex-1 flex items-center justify-center animate-pulse">
            <div className="w-full max-w-4xl bg-[#FDFCF8] dark:bg-[#1e293b] shadow-xl rounded-2xl p-6 border-4 border-double border-gray-200/50 dark:border-gray-700/50">
                <div className="flex justify-between items-center mb-6 px-2 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>

                <div className="space-y-6 pt-4">
                    <div className="flex justify-center">
                        <div className="h-10 w-48 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                    </div>

                    <div className="space-y-4">
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-11/12 mx-auto"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-10/12 ml-auto"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-9/12 mx-auto"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-8/12 mr-auto"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TranslationSkeleton: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 mb-12 animate-pulse w-full">
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800/60 p-4 space-y-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border-b border-gray-200 dark:border-gray-700/50 pb-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                            <div className="w-6 h-6 rounded bg-gray-300 dark:bg-gray-600"></div>
                        </div>
                        <div className="space-y-3 mb-6 flex flex-col items-end">
                            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

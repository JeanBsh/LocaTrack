"use client";

import React from "react";

interface PageHeaderProps {
    title: string;
    description: string;
    action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
                <p className="text-text-tertiary text-sm mt-1">{description}</p>
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
        </div>
    );
}

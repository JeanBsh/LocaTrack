"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SlidePanelProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export default function SlidePanel({ open, onClose, title, children, footer }: SlidePanelProps) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />
                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-full max-w-2xl bg-surface border-l border-border shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                            {title && (
                                <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-text-primary transition-colors cursor-pointer ml-auto"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {children}
                        </div>
                        {/* Footer (fixed at bottom) */}
                        {footer && (
                            <div className="flex-shrink-0">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

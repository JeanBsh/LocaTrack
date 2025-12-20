"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LayoutDashboard, Building2, Users, FileText, PieChart, LogOut } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AceternitySidebar({ children }: { children: React.ReactNode }) {
    const links = [
        {
            label: "Tableau de Bord",
            href: "/",
            icon: (
                <LayoutDashboard className="text-neutral-700 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Biens",
            href: "/biens",
            icon: (
                <Building2 className="text-neutral-700 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Locataires",
            href: "/locataires",
            icon: (
                <Users className="text-neutral-700 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Documents",
            href: "/documents",
            icon: (
                <FileText className="text-neutral-700 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Finance",
            href: "/finance",
            icon: (
                <PieChart className="text-neutral-700 h-5 w-5 flex-shrink-0" />
            ),
        },
    ];
    const [open, setOpen] = useState(false);
    return (
        <div
            className={cn(
                "flex flex-col md:flex-row bg-white w-full flex-1 mx-auto overflow-hidden",
                "h-screen"
            )}
        >
            <Sidebar open={open} setOpen={setOpen} animate={false}>
                <SidebarBody className="justify-between gap-10 bg-white border-r border-gray-200">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        <Logo />
                        <div className="mt-8 flex flex-col gap-2">
                            {links.map((link, idx) => (
                                <SidebarLink key={idx} link={link} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <SidebarLink
                            link={{
                                label: "Déconnexion",
                                href: "#",
                                icon: (
                                    <LogOut className="text-neutral-700 h-5 w-5 flex-shrink-0" />
                                ),
                            }}
                        />
                    </div>
                </SidebarBody>
            </Sidebar>
            <div className="flex flex-1 overflow-y-auto bg-white">
                <div className="p-2 md:p-10 bg-white flex flex-col gap-2 flex-1 w-full h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}

export const Logo = () => {
    return (
        <Link
            href="/"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-black rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium text-black whitespace-pre"
            >
                LocaTrack
            </motion.span>
        </Link>
    );
};

export const LogoIcon = () => {
    return (
        <Link
            href="#"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-black rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
        </Link>
    );
};

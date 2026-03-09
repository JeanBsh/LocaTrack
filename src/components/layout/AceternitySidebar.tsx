"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LayoutDashboard, Building2, Users, FileText, PieChart, LogOut, UserCog } from "lucide-react";
// Note: Building2 imported for nav links only, logo uses the original black shape
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";

const navLinks = [
    { label: "Tableau de Bord", href: "/dashboard", icon: LayoutDashboard },
    { label: "Biens", href: "/biens", icon: Building2 },
    { label: "Locataires", href: "/locataires", icon: Users },
    { label: "Documents", href: "/documents", icon: FileText },
    { label: "Finance", href: "/finance", icon: PieChart },
    { label: "Profil", href: "/profil", icon: UserCog },
];

export default function AceternitySidebar({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    if (pathname === "/" || pathname === "/login" || pathname === "/register") {
        return <>{children}</>;
    }

    const handleLogout = async () => {
        try {
            await auth.signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error("Erreur lors de la déconnexion", error);
        }
    };

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    const links = navLinks.map((link) => {
        const active = isActive(link.href);
        const Icon = link.icon;
        return {
            label: link.label,
            href: link.href,
            icon: (
                <div className={cn(
                    "p-1.5 rounded-lg transition-colors duration-200",
                    active
                        ? "bg-primary-900 text-white shadow-sm"
                        : "text-text-tertiary group-hover/sidebar:text-primary-800"
                )}>
                    <Icon className="h-4 w-4" />
                </div>
            ),
        };
    });

    return (
        <div className={cn(
            "flex flex-col md:flex-row w-full flex-1 mx-auto overflow-hidden",
            "h-screen"
        )}>
            <Sidebar open={open} setOpen={setOpen} animate={false}>
                <SidebarBody className="justify-between gap-6 bg-surface border-r border-border">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        <Logo />
                        <div className="mt-6 flex flex-col gap-0.5">
                            {links.map((link, idx) => {
                                const active = isActive(link.href);
                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "rounded-lg mx-1 transition-colors duration-200",
                                            active
                                                ? "bg-primary-50"
                                                : "hover:bg-surface-hover"
                                        )}
                                    >
                                        <SidebarLink
                                            link={link}
                                            className={cn(
                                                "px-2 py-2",
                                                active && "font-semibold"
                                            )}
                                            active={active}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="border-t border-border pt-3">
                        {user && (
                            <div className="mb-1">
                                <SidebarLink
                                    link={{
                                        label: user.email || "Utilisateur",
                                        href: "#",
                                        icon: (
                                            <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                                                {user.email ? user.email[0].toUpperCase() : "U"}
                                            </div>
                                        ),
                                    }}
                                    className="px-2 py-1.5"
                                />
                            </div>
                        )}
                        <div
                            className="cursor-pointer rounded-lg mx-1 hover:bg-danger-50 transition-colors duration-200"
                            onClick={handleLogout}
                        >
                            <SidebarLink
                                link={{
                                    label: "Déconnexion",
                                    href: "#",
                                    icon: (
                                        <div className="p-1.5 rounded-lg text-text-tertiary group-hover/sidebar:text-danger-600 transition-colors">
                                            <LogOut className="h-4 w-4" />
                                        </div>
                                    ),
                                }}
                                className="px-2 py-2"
                            />
                        </div>
                    </div>
                </SidebarBody>
            </Sidebar>
            <div className="flex flex-1 overflow-y-auto bg-background">
                <div className="flex flex-col flex-1 w-full h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}

export const Logo = () => {
    return (
        <Link
            href="/dashboard"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-black rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-black whitespace-pre text-base tracking-tight"
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

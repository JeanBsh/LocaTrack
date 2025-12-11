'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, Users, FileText, PieChart } from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
    { href: '/', label: 'Tableau de Bord', icon: Home },
    { href: '/biens', label: 'Biens', icon: Building2 },
    { href: '/locataires', label: 'Locataires', icon: Users },
    { href: '/baux', label: 'Baux', icon: FileText },
    { href: '/finance', label: 'Finance', icon: PieChart },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <Building2 />
                LocaTrack
            </div>
            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.link} ${isActive ? styles.active : ''}`}
                        >
                            <Icon className={styles.icon} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

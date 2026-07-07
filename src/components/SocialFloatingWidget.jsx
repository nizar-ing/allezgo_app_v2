import { useState } from 'react';
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa';

const SOCIAL_LINKS = [
    { icon: FaFacebookF, label: 'Facebook',  href: 'https://www.facebook.com/AllezGooo?mibextid=wwXIfr&rdid=mo24n3az6HNVjQ4d&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1CYVGWDGfB%2F%3Fmibextid%3DwwXIfr#', brandColor: '#1877F2', glowColor: 'rgba(24,119,242,0.45)' },
    { icon: FaInstagram, label: 'Instagram', href: 'https://www.instagram.com/allezgoobooking?igsh=a2NtNW1jNDJzaHhw', brandColor: '#E1306C', glowColor: 'rgba(225,48,108,0.45)' },
    { icon: FaTiktok,    label: 'TikTok',    href: 'https://www.tiktok.com/@allezgoo_booking?_r=1&_t=ZS-97qN8yHyr0H', brandColor: '#EE1D52', glowColor: 'rgba(238,29,82,0.45)' },
    { icon: FaYoutube,   label: 'YouTube',   href: '#', brandColor: '#FF0000', glowColor: 'rgba(255,0,0,0.45)'   },
];

function SocialLink({ icon: Icon, label, href, brandColor, glowColor }) {
    const [hovered, setHovered] = useState(false);

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                height: '48px',
                width: hovered ? '160px' : '48px',
                borderRadius: '24px 0 0 24px',
                background: hovered ? brandColor : 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRight: 'none',
                boxShadow: hovered
                    ? `0 4px 24px ${glowColor}, -2px 0 12px ${glowColor}`
                    : '0 2px 10px rgba(0,0,0,0.35)',
                transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1), background 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
                textDecoration: 'none',
                outline: 'none',
            }}
        >
            {/* Left expandable section — accent strip + label, hidden when collapsed */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: hovered ? '112px' : '0px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
                }}
            >
                {/* Colored accent strip */}
                <div
                    style={{
                        width: '3px',
                        height: '22px',
                        borderRadius: '0 3px 3px 0',
                        background: 'rgba(255,255,255,0.55)',
                        flexShrink: 0,
                        marginLeft: '10px',
                        marginRight: '8px',
                    }}
                />
                {/* Platform label */}
                <span
                    style={{
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                        opacity: hovered ? 1 : 0,
                        transform: hovered ? 'translateX(0)' : 'translateX(5px)',
                        transition: 'opacity 0.2s ease 0.15s, transform 0.2s ease 0.15s',
                    }}
                >
                    {label}
                </span>
            </div>

            {/* Icon — always visible, right-anchored */}
            <div
                style={{
                    width: '48px',
                    height: '48px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: hovered ? 'scale(1.18)' : 'scale(1)',
                    transition: 'transform 0.3s ease',
                }}
            >
                <Icon
                    style={{
                        fontSize: '17px',
                        color: '#ffffff',
                        filter: hovered ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none',
                        transition: 'filter 0.3s ease',
                    }}
                />
            </div>
        </a>
    );
}

function SocialFloatingWidget() {
    return (
        <nav
            role="complementary"
            aria-label="Réseaux sociaux"
            className="hidden sm:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 flex-col gap-2 py-2"
        >
            {SOCIAL_LINKS.map((social) => (
                <SocialLink key={social.label} {...social} />
            ))}
        </nav>
    );
}

export default SocialFloatingWidget;

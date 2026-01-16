"use client";
import { toggleMobileMenu } from "@/utlis/toggleMobileMenu";
import Nav from "./components/Nav";
import LanguageSelect from "./components/LanguageSelect";
import Link from "next/link";

export default function Header8({ links }) {
  return (
    <div className="main-nav-sub full-wrapper">
      {/* Logo */}
      <div className="nav-logo-wrap local-scroll">
        <a href="#top" className="logo font-alt">
          <span className="logo-text">Evoleotion</span>
        </a>
      </div>
      {/* Mobile Menu Button */}
      <div
        onClick={toggleMobileMenu}
        className="mobile-nav"
        role="button"
        tabIndex={0}
      >
        <i className="mobile-nav-icon" />
        <span className="visually-hidden">Menu</span>
      </div>
      {/* Main Menu */}
      <div className="inner-nav desktop-nav">
        <ul className="clearlist scroll-nav local-scroll justify-content-end scrollspyLinks">
          <Nav links={links} animateY />
          <li className="desktop-nav-display">
            <div className="vr" />
          </li>
          {/* Languages */}
          {/* <LanguageSelect /> */}
          {/* End Languages */}
          <li>
            {links[0].href.includes("/") ? (
              <Link
                href={links[links.length - 1].href}
                className="opacity-1 no-hover"
              >
                <span
                  className="btn btn-mod btn-border btn-border-white btn-small btn-circle"
                  data-btn-animate="y"
                >
                  Let's Talk
                </span>
              </Link>
            ) : (
              <a href="#contact" className="opacity-1 no-hover">
                <span
                  className="btn btn-mod btn-border btn-border-white btn-small btn-circle"
                  data-btn-animate="y"
                >
                  Let's Talk
                </span>
              </a>
            )}
          </li>
        </ul>
      </div>
      {/* End Main Menu */}
    </div>
  );
}

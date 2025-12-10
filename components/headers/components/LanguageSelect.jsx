import React, { useState, useRef } from "react";

export default function LanguageSelect() {
  // State to manage dropdown visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // State to manage the selected language
  const [selectedLanguage, setSelectedLanguage] = useState("En");

  const dropdownRef = useRef(null);

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle language selection
  const handleLanguageSelect = (language, event) => {
    event.preventDefault();
    setSelectedLanguage(language);
    setIsDropdownOpen(false); // Close dropdown after selecting a language
  };

  return (
    <li className={`languageSelect ${isDropdownOpen ? "js-opened" : ""}`}>
      <a
        href="#"
        className="mn-has-sub opacity-1"
        onClick={(e) => {
          e.preventDefault();
          toggleDropdown();
        }}
      >
        {selectedLanguage} <i className="mi-chevron-down" />
      </a>

      {/* Dropdown menu */}
      <ul
        className="mn-sub to-left"
        ref={dropdownRef}
        style={{ display: isDropdownOpen ? "block" : "none" }}
      >
        <li>
          <a href="#" onClick={(e) => handleLanguageSelect("En", e)}>
            English
          </a>
        </li>
        <li>
          <a href="#" onClick={(e) => handleLanguageSelect("Fr", e)}>
            French
          </a>
        </li>
        <li>
          <a href="#" onClick={(e) => handleLanguageSelect("De", e)}>
            German
          </a>
        </li>
      </ul>
    </li>
  );
}

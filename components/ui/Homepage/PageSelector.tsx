import React from 'react';

type PageSelectorProps = {
  selectedPage: string;
  onChange: (page: string) => void;
};

const PageSelector: React.FC<PageSelectorProps> = ({ selectedPage, onChange }) => {
  return (
    <div className="text-center">
      <p className="mb-4">Select your default homepage:</p>
      <select
        value={selectedPage}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded p-2"
      >
        <option value="default">Default Page</option>
        <option value="above100">Level Above 100 Page</option>
        <option value="level300">Level 300 Page</option>
      </select>
    </div>
  );
};

export default PageSelector;

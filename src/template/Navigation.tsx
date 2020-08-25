import React from "react";
import { Link } from "react-router-dom";
const githubUrl = "https://github.com/gentics/headless-cms-comparison";
const Navigation = () => {
  return (
    <nav>
      <div className="container">
        <div className="row">
          <div className="col-6">
            <div className="logo">
              <Link to="/">CMS Comparison</Link>
            </div>
          </div>
          <div className="col-6 text-right align-self-center">
            <ul>
              <li>
                <Link to="/card">
                  <i className="fa fa-table" aria-hidden="true"></i> Card view
                </Link>
              </li>
              <li>
                <Link to="/list">
                  <i className="fa fa-table" aria-hidden="true"></i> List view
                </Link>
              </li>
              <li>
                <Link to="/about">About us</Link>
              </li>
              <li>
                <a href={githubUrl}>Github</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

// @ts-ignore
export default Navigation;

import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Link } from "react-router-dom";

const Menu = () => {
  return (
    <section id="filter-menu">
      <Container>
        <Row>
          <Col className="col-12 filters">
            <Col className="filter-switch">
              <Link to="/card">
                <i className="fa fa-table" aria-hidden="true"></i> Card view
              </Link>
            </Col>
            <ul className="controls">
              <li className="control">All</li>
              <li className="control card-color-1">open source</li>
              <li className="control card-color-5">cloud service</li>
              <li className="control card-color-3">Enterprise</li>
              <li className="control card-color-4">Docker</li>
              <li className="control card-color-5">GraphQL</li>
              <li>Custom Filters</li>
            </ul>
            <div className="list-card-switch">
              <Link to="/list">
                <i className="fa fa-table" aria-hidden="true"></i> List view
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Menu;

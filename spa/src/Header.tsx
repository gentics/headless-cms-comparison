import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import illustration from "./images/illustration.svg";

const Header = () => {
  return (
    <header>
      <Container>
        <Row>
          <Col className="col-6 align-self-center">
            <h1>Welcome to the Headless CMS Comparison Website</h1>
            <h3>Find the perfect headless CMS for your requirements!</h3>
          </Col>
          <Col className="col-6 align-self-center hero">
            <img src={illustration} alt="" />
          </Col>
        </Row>
      </Container>
      <svg
        version="1.1"
        id="Layer_1"
        x="0px"
        y="0px"
        viewBox="0 0 1140 192.9"
        className="svg-line"
      >
        <g>
          <path className="st0" d="M0.2,11.2C2,12,3.8,12.8,5.7,13.7" />
          <path
            className="st1"
            d="M16.5,19.2c43.5,22.9,99.8,63.8,160.7,95.8c16.1,8.4,41.4,13.6,70,7.3c4.8-1.1,51.9-12.2,68-52.2
			c2.8-6.9,11.6-28.7,0.7-45.6C306.7,10,290.7,2.5,278.5,0.9c-10.5-1.4-31,1.2-44.5,13c-8.5,7.4-11.2,17.2-11.9,19.8
			c-0.7,2.6-3.2,12.9,0.7,23.8c5,14.1,19.4,30.8,27.5,35.2c51.3,27.7,63.6,22.4,83.2,26.9c42.1,9.5,14.6,1.5,103.3,24.8
			c10.3,2.7,27.1,5.3,41.3,5c20.3-0.5,49.2-13.4,67-19.2c14.8-4.8,46-9,60.1,9.2c6.9,8.9,8.4,21.6,5.4,34.7"
          />
          <path className="st0" d="M609,179.9c-0.6,1.9-1.3,3.7-2.1,5.6" />
          <path
            className="st2"
            d="M607.6,183.9l4.2-0.4l0,0.1l-4.6,4.3c-1.3,1.7-2.6,3.3-3.9,5c0.5-2,1-4.1,1.4-6.1l0.4-6.3l0.1-0.1L607.6,183.9z"
          />
        </g>
      </svg>
    </header>
  );
};

export default Header;

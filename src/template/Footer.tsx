import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

const Footer = () => {
  return (
    <footer>
      <Container>
        <Row>
          <Col>
            <p>
              CMS Comparison is hosted and maintained by{" "}
              <a href="https://getmesh.io/">Gentics</a>.
            </p>
          </Col>
        </Row>
        <Row>
          <Col className="col-12">© Gentics 2020.</Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;

import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

type PropsType = {
  title: string;
};

const SmallHeader = ({ title }: PropsType) => {
  return (
    <header className="small">
      <Container>
        <Row>
          <Col className="col-12 align-self-center">
            <h1>{title}</h1>
          </Col>
        </Row>
      </Container>
    </header>
  );
};

export default SmallHeader;

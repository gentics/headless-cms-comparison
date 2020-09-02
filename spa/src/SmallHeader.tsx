import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { CmsData } from "./Cms";
import { useParams } from "react-router-dom";

type PropsType = {
  title: string | CmsData;
};

const SmallHeader = ({ title }: PropsType) => {
  const { cmsKey } = useParams();

  if (typeof title === "object") {
    title = title[cmsKey].name;
  }

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

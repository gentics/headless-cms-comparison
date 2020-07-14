import * as React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ProgressBar from "react-bootstrap/ProgressBar";
import Alert from "react-bootstrap/Alert";
import CmsService from "./CmsService";
import FilterPanel from "./FilterPanel";

// Icons
import { AiFillCheckCircle } from "react-icons/ai";
import { AiFillLike } from "react-icons/ai";
import { AiFillDislike } from "react-icons/ai";
import { AiFillStar } from "react-icons/ai";

export default function CardList() {
  test();
  const [cmsData, setCmsData] = React.useState<any>();
  const [filterData, setFilterData] = React.useState<any>(null);
  const [fetchError, setFetchError] = React.useState<any>(null);

  React.useEffect(() => {
    console.log("Fetching...");
    CmsService.getCmsData()
      .then(setCmsData)
      .catch((e) => {
        console.log("Error detected!");
        setFetchError(e);
      });
  }, []);

  React.useEffect(() => {
    console.log("Filter updated!");
    console.log(filterData);
  }, [filterData]);

  const setFilter = function (newFilterData: Array<any>) {
    setFilterData(newFilterData);
    /*
    if (!filterData) {
      setFilterData(newFilterData);
    } else {
      newFilterData.niceToHave.forEach(fieldName => {
        if (!filterData.niceToHave.includes(fieldName)) {

        }
      })
    }*/ // TODO: Continue here
  };

  const getFilter = function (): Array<any> {
    return filterData;
  };

  if (cmsData) {
    const cards = constructCards(cmsData, filterData);
    return (
      <div>
        <FilterPanel
          cmsData={cmsData}
          setFilter={setFilter}
          getFilter={getFilter}
        />
        <div className="d-flex flex-wrap justify-content-center">{cards}</div>
      </div>
    );
  } else if (fetchError) {
    return (
      <Alert variant="danger">
        An error occurred while fetching: {fetchError.message}
      </Alert>
    );
  } else {
    return <ProgressBar animated now={100} />;
  }
}

function constructCards(cmsData: any, filterData: Array<any>): Array<any> {
  let filter: any = filterData;
  if (filter) {
    console.log(filter);
    const requiredCms: any[] = [];
    cmsData.cms.forEach((cms: any) => {
      const matchingProperties: string[][] = [];
      const cmsIsValid = filter.required.every((property: Array<any>) => {
        const name = property[0]; // String
        // return true, if a specific cms property does contain at least one specified value
        const matchingProperty = property[1].find((value: string) => {
          return cms[name].includes(value);
        });
        if (!matchingProperty) {
          return false;
        } else {
          matchingProperties.push([name, matchingProperty]);
          return true;
        }
      });
      if (cmsIsValid) {
        const resObj = Object.create(null);
        resObj["cms"] = cms;
        resObj["required"] = matchingProperties;
        requiredCms.push(resObj);
      }
    });

    filter = requiredCms.map((tupel: any) => {
      // TODO: rename "matching"
      const niceToHave: string[][] = [];
      filter["niceToHave"].forEach((property: string) => {
        niceToHave.push([
          property,
          tupel.cms[property].includes("Yes") ? "Yes" : "No",
        ]);
      });
      tupel["niceToHave"] = niceToHave;
      return tupel; // Now tripel
    });
  } else {
    filter = cmsData.cms.map((cms: any) => {
      const resObj = Object.create(null);
      resObj["cms"] = cms;
      resObj["required"] = [];
      resObj["niceToHave"] = [];
      return resObj;
    });
  }

  console.log(filter);

  if (filter.length === 0) {
    return [
      <div className={"my-2 mx-2 w-75"}>
        <Card>
          <Card.Body>
            <Card.Title>😐 No CMS matches your requirements...</Card.Title>
            <Card.Text>
              De-select some of the specified requirements and try again!
            </Card.Text>
          </Card.Body>
        </Card>
      </div>,
    ];
  } else {
    return filter.map((tripel: any) => {
      const requiredProgress =
        tripel.required.length > 0 || tripel.niceToHave.length > 0
          ? (tripel.required.length /
              (tripel.required.length + tripel.niceToHave.length)) *
            100
          : 0;

      const niceToHaveProgress =
        tripel.niceToHave.length > 0
          ? (tripel.niceToHave.filter((property: Array<any>) => {
              return property[1] === "Yes";
            }).length /
              (tripel.required.length + tripel.niceToHave.length)) *
            100
          : 0;

      const niceToHaveShare =
        tripel.niceToHave.length > 0
          ? (tripel.niceToHave.filter((property: Array<any>) => {
              return property[1] === "Yes";
            }).length /
              tripel.niceToHave.length) *
            100
          : 0;

      const requiredText =
        tripel.required.length > 0 ? (
          <li>
            <AiFillCheckCircle /> Matches all specified requirements
          </li>
        ) : (
          <li></li>
        );

      const niceToHaveText =
        tripel.niceToHave.length > 0 ? (
          <li>
            {niceToHaveShare > 0 ? (
              niceToHaveShare === 100 ? (
                <AiFillStar />
              ) : (
                <AiFillLike />
              )
            ) : (
              <AiFillDislike />
            )}{" "}
            Has{" "}
            {niceToHaveShare > 0 ? niceToHaveShare.toFixed(0) + "% " : "none "}
            of the specified Nice-To-Have's.
          </li>
        ) : (
          <li></li>
        );

      const progressBars =
        tripel.required.length > 0 || tripel.niceToHave.length > 0 ? (
          <ProgressBar className="mb-2">
            <ProgressBar
              key={1}
              animated
              variant="info"
              now={requiredProgress}
            />
            <ProgressBar
              key={2}
              animated
              variant="warning"
              now={niceToHaveProgress}
            />
          </ProgressBar>
        ) : (
          <p></p>
        );

      return (
        <div className={"my-2 mx-2"} key={tripel.cms.Name}>
          <Card style={{ width: "18rem" }} className={"cmsCard"}>
            <Card.Body style={{ textAlign: "left" }}>
              <Card.Title>{tripel.cms.Name}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">
                Version {tripel.cms.Version}
              </Card.Subtitle>
              <Card.Text>
                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                  {requiredText}
                  {niceToHaveText}
                </ul>
              </Card.Text>
              {progressBars}
              <div className="d-flex justify-content-start">
                <Button variant="info">Details</Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      );
    });
  }
}
import { Link } from "@tanstack/react-router";
import { Card, Col, Container, Navbar, Row } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles.css";
import * as m from "../paraglide/messages.js";
import { AppNavbar } from "../components/AppNavbar";
import { REFERENCE_PAGES } from "../referencePages";

export default function ReferenceOverview() {
  return (
    <>
      <AppNavbar>
        <Navbar.Text className="fw-semibold ref-nav-text">
          <i className="bi bi-journals me-2" style={{ color: "var(--bt-be-light)" }} />
          {m.ref_overview_hub_title()}
        </Navbar.Text>
      </AppNavbar>

      <Container fluid="lg" className="pb-5">
        <div className="text-center mb-5 mt-2">
          <h1 className="mb-2" style={{ fontSize: "2.2rem" }}>
            🇧🇪&thinsp;🇳🇱&nbsp; {m.ref_overview_page_title()}
          </h1>
          <p className="text-secondary" style={{ maxWidth: 540, margin: "0 auto" }}>
            {m.ref_overview_subtitle()}
          </p>
        </div>

        <Row className="g-4 justify-content-center">
          {REFERENCE_PAGES.map((page) => (
            <Col key={page.route} xs={12} md={5}>
              <Link to={page.route} className="text-decoration-none">
                <Card
                  className="h-100 ref-overview-card"
                  style={{ border: `1px solid ${page.borderColor}` }}
                >
                  <Card.Body className="p-4">
                    <div className="mb-3">
                      <i
                        className={`bi ${page.icon}`}
                        style={{ fontSize: "2rem", color: page.iconColor }}
                      />
                    </div>
                    <Card.Title className="fw-bold mb-2 ref-overview-card__title">
                      {page.titleFn()}
                    </Card.Title>
                    <Card.Text className="ref-overview-card__text">{page.descFn()}</Card.Text>
                    <span className="small fw-semibold" style={{ color: page.accentColor }}>
                      {m.ref_nav_read_more()} <i className="bi bi-arrow-right ms-1" />
                    </span>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}

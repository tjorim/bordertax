import { Link } from "@tanstack/react-router";
import { Button, Card, Col, Container, Navbar, Row } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles.css";
import * as m from "../paraglide/messages.js";
import { getLocale, setLocale } from "../paraglide/runtime.js";

export default function ReferenceOverview() {
  const nextLangLabel = getLocale() === "en" ? m.lang_nl() : m.lang_en();

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Link to="/" style={{ textDecoration: "none" }}>
            <Navbar.Brand style={{ fontSize: "0.95rem", opacity: 0.8 }}>
              <i className="bi bi-arrow-left me-2" />
              {m.ref_nav_back_to_calculator()}
            </Navbar.Brand>
          </Link>
          <Navbar.Text className="fw-semibold" style={{ color: "var(--bt-text)" }}>
            <i className="bi bi-journals me-2" style={{ color: "var(--bt-be-light)" }} />
            {m.ref_overview_hub_title()}
          </Navbar.Text>
          <Button
            variant="outline-light"
            size="sm"
            className="ms-3"
            onClick={() => {
              setLocale(getLocale() === "en" ? "nl" : "en");
            }}
            aria-label={nextLangLabel}
          >
            {nextLangLabel}
          </Button>
        </Container>
      </Navbar>

      <Container fluid="lg" className="pb-5">
        <div className="text-center mb-5 mt-2">
          <h1 className="mb-2" style={{ fontFamily: "var(--bt-font-display)", fontSize: "2.2rem" }}>
            🇧🇪&thinsp;🇳🇱&nbsp; {m.ref_overview_page_title()}
          </h1>
          <p className="text-secondary" style={{ maxWidth: 540, margin: "0 auto" }}>
            {m.ref_overview_subtitle()}
          </p>
        </div>

        <Row className="g-4 justify-content-center">
          <Col xs={12} md={5}>
            <Link to="/reference/salary-split" style={{ textDecoration: "none" }}>
              <Card
                className="h-100"
                style={{
                  background: "var(--bt-surface-2)",
                  border: "1px solid var(--bt-nl-border)",
                  borderRadius: "var(--bt-r-lg)",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <Card.Body className="p-4">
                  <div className="mb-3">
                    <i
                      className="bi bi-calculator-fill"
                      style={{ fontSize: "2rem", color: "var(--bt-nl-light)" }}
                    />
                  </div>
                  <Card.Title
                    className="fw-bold mb-2"
                    style={{ color: "var(--bt-text)", fontSize: "1.15rem" }}
                  >
                    {m.ref_overview_ss_title()}
                  </Card.Title>
                  <Card.Text style={{ color: "var(--bt-text-sub)", fontSize: "0.92rem" }}>
                    {m.ref_overview_ss_desc()}
                  </Card.Text>
                  <span className="small fw-semibold" style={{ color: "var(--bt-nl-light)" }}>
                    {m.ref_nav_read_more()} <i className="bi bi-arrow-right ms-1" />
                  </span>
                </Card.Body>
              </Card>
            </Link>
          </Col>

          <Col xs={12} md={5}>
            <Link to="/reference/pension" style={{ textDecoration: "none" }}>
              <Card
                className="h-100"
                style={{
                  background: "var(--bt-surface-2)",
                  border: "1px solid var(--bt-be-border)",
                  borderRadius: "var(--bt-r-lg)",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <Card.Body className="p-4">
                  <div className="mb-3">
                    <i
                      className="bi bi-piggy-bank-fill"
                      style={{ fontSize: "2rem", color: "var(--bt-be-light)" }}
                    />
                  </div>
                  <Card.Title
                    className="fw-bold mb-2"
                    style={{ color: "var(--bt-text)", fontSize: "1.15rem" }}
                  >
                    {m.ref_overview_pension_title()}
                  </Card.Title>
                  <Card.Text style={{ color: "var(--bt-text-sub)", fontSize: "0.92rem" }}>
                    {m.ref_overview_pension_desc()}
                  </Card.Text>
                  <span className="small fw-semibold" style={{ color: "var(--bt-be-light)" }}>
                    {m.ref_nav_read_more()} <i className="bi bi-arrow-right ms-1" />
                  </span>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        </Row>
      </Container>
    </>
  );
}

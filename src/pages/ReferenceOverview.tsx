import { Link } from "@tanstack/react-router";
import { Card, Col, Container, Navbar, Row } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles.css";
import * as m from "../paraglide/messages.js";
import { LanguageToggleButton } from "./reference/components.js";

interface ReferenceCard {
  route: string;
  icon: string;
  iconColor: string;
  borderColor: string;
  titleFn: () => string;
  descFn: () => string;
  accentColor: string;
}

const cards: ReferenceCard[] = [
  {
    route: "/reference/salary-split",
    icon: "bi-calculator-fill",
    iconColor: "var(--bt-nl-light)",
    borderColor: "var(--bt-nl-border)",
    titleFn: m.ref_overview_ss_title,
    descFn: m.ref_overview_ss_desc,
    accentColor: "var(--bt-nl-light)",
  },
  {
    route: "/reference/pension",
    icon: "bi-piggy-bank-fill",
    iconColor: "var(--bt-be-light)",
    borderColor: "var(--bt-be-border)",
    titleFn: m.ref_overview_pension_title,
    descFn: m.ref_overview_pension_desc,
    accentColor: "var(--bt-be-light)",
  },
];

export default function ReferenceOverview() {
  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Link to="/" className="text-decoration-none">
            <Navbar.Brand className="ref-nav-brand">
              <i className="bi bi-arrow-left me-2" />
              {m.ref_nav_back_to_calculator()}
            </Navbar.Brand>
          </Link>
          <Navbar.Text className="fw-semibold ref-nav-text">
            <i className="bi bi-journals me-2" style={{ color: "var(--bt-be-light)" }} />
            {m.ref_overview_hub_title()}
          </Navbar.Text>
          <LanguageToggleButton />
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
          {cards.map((card) => (
            <Col key={card.route} xs={12} md={5}>
              <Link to={card.route} className="text-decoration-none">
                <Card
                  className="h-100 ref-overview-card"
                  style={{ border: `1px solid ${card.borderColor}` }}
                >
                  <Card.Body className="p-4">
                    <div className="mb-3">
                      <i
                        className={`bi ${card.icon}`}
                        style={{ fontSize: "2rem", color: card.iconColor }}
                      />
                    </div>
                    <Card.Title className="fw-bold mb-2 ref-overview-card__title">
                      {card.titleFn()}
                    </Card.Title>
                    <Card.Text className="ref-overview-card__text">
                      {card.descFn()}
                    </Card.Text>
                    <span className="small fw-semibold" style={{ color: card.accentColor }}>
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

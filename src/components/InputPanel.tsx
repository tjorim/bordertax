import { Accordion, Badge, Col, Form, Row } from 'react-bootstrap';
import { VALID_YEARS } from '../tax/constants';
import type { TaxInputs } from '../tax/types';

interface Props {
  inputs: TaxInputs;
  onChange: (updated: TaxInputs) => void;
}

export default function InputPanel({ inputs, onChange }: Props) {
  function set<K extends keyof TaxInputs>(key: K, value: TaxInputs[K]) {
    onChange({ ...inputs, [key]: value });
  }

  return (
    <Accordion defaultActiveKey={['0', '1', '2']} alwaysOpen>
      {/* ── Section 1: Situation ─────────────────────────────── */}
      <Accordion.Item eventKey="0">
        <Accordion.Header>
          <i className="bi bi-person-fill me-2" />
          Personal situation
        </Accordion.Header>
        <Accordion.Body>
          <Row className="g-3">
            <Col xs={12} sm={6}>
              <Form.Label>Tax year</Form.Label>
              <Form.Select
                value={inputs.year}
                onChange={(e) => set('year', Number(e.target.value) as TaxInputs['year'])}
              >
                {VALID_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>Country of residence</Form.Label>
              <Form.Select
                value={inputs.residentCountry}
                onChange={(e) => set('residentCountry', e.target.value as TaxInputs['residentCountry'])}
              >
                <option value="BE">🇧🇪 Belgium</option>
                <option value="NL">🇳🇱 Netherlands</option>
              </Form.Select>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>
                Civil status{' '}
                <Badge bg="secondary" className="ms-1 fw-normal" aria-label="Note: this field is not yet used in calculations">
                  not yet used in calculations
                </Badge>
              </Form.Label>
              <Form.Select
                value={inputs.civilStatus}
                onChange={(e) => set('civilStatus', e.target.value as TaxInputs['civilStatus'])}
              >
                <option value="single">Single</option>
                <option value="married">Married / registered partner</option>
              </Form.Select>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>Dependents (children)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={10}
                value={inputs.dependentChildren}
                onChange={(e) => set('dependentChildren', Math.max(0, Number(e.target.value)))}
              />
            </Col>

            <Col xs={12}>
              <Form.Check
                id="aow-age"
                label="I am below Dutch AOW retirement age"
                checked={inputs.belowAOWAge}
                onChange={(e) => set('belowAOWAge', e.target.checked)}
              />
            </Col>

            {inputs.residentCountry === 'BE' && (
              <>
                <Col xs={12} sm={6}>
                  <Form.Label>
                    Belgian region{' '}
                    <Badge bg="secondary" className="ms-1 fw-normal" aria-label="Note: this field is not yet used in calculations">
                      not yet used in calculations
                    </Badge>
                  </Form.Label>
                  <Form.Select
                    value={inputs.belgianRegion}
                    onChange={(e) => set('belgianRegion', e.target.value as TaxInputs['belgianRegion'])}
                  >
                    <option value="flemish">Flemish Region</option>
                    <option value="walloon">Walloon Region</option>
                    <option value="brussels">Brussels-Capital Region</option>
                  </Form.Select>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Label>
                    Municipal tax{' '}
                    <Badge bg="secondary" className="ms-1">
                      %
                    </Badge>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={15}
                    step={0.1}
                    value={inputs.communalTaxRate}
                    onChange={(e) => set('communalTaxRate', Number(e.target.value))}
                  />
                  <Form.Text className="text-muted">Check your municipality (average ±7%)</Form.Text>
                </Col>
              </>
            )}
          </Row>
        </Accordion.Body>
      </Accordion.Item>

      {/* ── Section 2: Income ────────────────────────────────── */}
      <Accordion.Item eventKey="1">
        <Accordion.Header>
          <i className="bi bi-cash-coin me-2" />
          Income
        </Accordion.Header>
        <Accordion.Body>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Label>Gross annual salary (€)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={100}
                value={inputs.grossSalary}
                onChange={(e) => set('grossSalary', Number(e.target.value))}
              />
              <Form.Text className="text-muted">
                Full gross salary as listed on your annual statement / payslip
              </Form.Text>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>
                Workdays in 🇳🇱 NL
              </Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={inputs.daysWorkedNL}
                onChange={(e) => set('daysWorkedNL', Math.max(0, Number(e.target.value)))}
              />
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>
                Home-working days in 🇧🇪 BE
              </Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={inputs.daysWorkedBE}
                onChange={(e) => set('daysWorkedBE', Math.max(0, Number(e.target.value)))}
              />
            </Col>

            <Col xs={12}>
              <Form.Check
                id="thirty-ruling"
                label="30% ruling applies (NL)"
                checked={inputs.thirtyPercentRuling}
                onChange={(e) => set('thirtyPercentRuling', e.target.checked)}
              />
              <Form.Text className="text-muted">
                Expat rule: 30% of salary is tax free
              </Form.Text>
            </Col>
          </Row>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

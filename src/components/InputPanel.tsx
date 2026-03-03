import { Accordion, Badge, Col, Form, Row } from 'react-bootstrap';
import { VALID_YEARS } from '../tax/constants';
import type { TaxInputs } from '../tax/types';
import * as m from '../paraglide/messages.js';

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
          {m.input_personal_situation()}
        </Accordion.Header>
        <Accordion.Body>
          <Row className="g-3">
            <Col xs={12} sm={6}>
              <Form.Label>{m.input_tax_year()}</Form.Label>
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
              <Form.Label>{m.input_resident_country()}</Form.Label>
              <Form.Select
                value={inputs.residentCountry}
                onChange={(e) => set('residentCountry', e.target.value as TaxInputs['residentCountry'])}
              >
                <option value="BE">🇧🇪 {m.input_resident_country_be()}</option>
                <option value="NL">🇳🇱 {m.input_resident_country_nl()}</option>
              </Form.Select>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>
                {m.input_civil_status()}{' '}
                <Badge bg="secondary" className="ms-1 fw-normal" aria-label={`Note: ${m.input_civil_status_not_used()}`}>
                  {m.input_civil_status_not_used()}
                </Badge>
              </Form.Label>
              <Form.Select
                value={inputs.civilStatus}
                onChange={(e) => set('civilStatus', e.target.value as TaxInputs['civilStatus'])}
              >
                <option value="single">{m.input_civil_status_single()}</option>
                <option value="married">{m.input_civil_status_married()}</option>
              </Form.Select>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>{m.input_dependents()}</Form.Label>
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
                label={m.input_below_aow_age()}
                checked={inputs.belowAOWAge}
                onChange={(e) => set('belowAOWAge', e.target.checked)}
              />
            </Col>

            {inputs.residentCountry === 'BE' && (
              <>
                <Col xs={12} sm={6}>
                  <Form.Label>
                    {m.input_belgian_region()}{' '}
                    <Badge bg="secondary" className="ms-1 fw-normal" aria-label={`Note: ${m.input_belgian_region_not_used()}`}>
                      {m.input_belgian_region_not_used()}
                    </Badge>
                  </Form.Label>
                  <Form.Select
                    value={inputs.belgianRegion}
                    onChange={(e) => set('belgianRegion', e.target.value as TaxInputs['belgianRegion'])}
                  >
                    <option value="flemish">{m.input_belgian_region_flemish()}</option>
                    <option value="walloon">{m.input_belgian_region_walloon()}</option>
                    <option value="brussels">{m.input_belgian_region_brussels()}</option>
                  </Form.Select>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Label>
                    {m.input_municipal_tax()}{' '}
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
                  <Form.Text className="text-muted">{m.input_municipal_tax_hint()}</Form.Text>
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
          {m.input_income()}
        </Accordion.Header>
        <Accordion.Body>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Label>{m.input_gross_salary()}</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={100}
                value={inputs.grossSalary}
                onChange={(e) => set('grossSalary', Number(e.target.value))}
              />
              <Form.Text className="text-muted">
                {m.input_gross_salary_hint()}
              </Form.Text>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Label>
                {m.input_workdays_nl()}
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
                {m.input_workdays_be()}
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
                label={m.input_thirty_percent_ruling()}
                checked={inputs.thirtyPercentRuling}
                onChange={(e) => set('thirtyPercentRuling', e.target.checked)}
              />
              <Form.Text className="text-muted">
                {m.input_thirty_percent_ruling_hint()}
              </Form.Text>
            </Col>
          </Row>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

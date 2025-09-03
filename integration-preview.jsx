// PREVIEW: How AI will integrate with your existing RMFCategorizeStep.jsx

// Your existing modal structure stays the same, we just add AI assistance:

{/* EXISTING: Add System Modal */}
<Modal isOpen={addSystemModal} toggle={() => setAddSystemModal(false)} size="xl"> {/* Changed to xl for AI panel */}
  <ModalHeader toggle={() => setAddSystemModal(false)}>Add Information System</ModalHeader>
  <ModalBody>
    <Row>
      {/* LEFT SIDE: Your existing form (unchanged) */}
      <Col lg="8">
        <Form>
          {/* ALL YOUR EXISTING FIELDS STAY EXACTLY THE SAME */}
          <Row className="g-3">
            <Col md="6">
              <FormGroup>
                <Label className="form-label">System Name *</Label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Enter system name"
                  value={systemForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label className="form-label">System Type *</Label>
                <RSelect
                  options={systemTypes}
                  value={systemTypes.find(opt => opt.value === systemForm.systemType)}
                  onChange={(option) => handleFormChange('systemType', option?.value || '')}
                  placeholder="Select system type"
                />
              </FormGroup>
            </Col>
            
            {/* YOUR EXISTING IMPACT LEVEL DROPDOWNS */}
            <Col md="4">
              <FormGroup>
                <Label className="form-label">Confidentiality Impact *</Label>
                <RSelect
                  options={impactLevels}
                  value={impactLevels.find(opt => opt.value === systemForm.confidentialityImpact)}
                  onChange={(option) => handleFormChange('confidentialityImpact', option?.value || '')}
                  placeholder="Select level"
                />
              </FormGroup>
            </Col>
            {/* ... integrity and availability dropdowns stay the same ... */}
            
            {/* YOUR EXISTING DATA TYPES MULTI-SELECT */}
            <Col md="6">
              <FormGroup>
                <Label className="form-label">Data Types</Label>
                <RSelect
                  options={dataTypeOptions}
                  isMulti
                  value={dataTypeOptions.filter(opt => systemForm.dataTypes.includes(opt.value))}
                  onChange={(options) => handleFormChange('dataTypes', options ? options.map(opt => opt.value) : [])}
                  placeholder="Select data types"
                />
              </FormGroup>
            </Col>
            
            {/* ALL OTHER EXISTING FIELDS UNCHANGED */}
          </Row>
        </Form>
      </Col>
      
      {/* RIGHT SIDE: NEW AI Assistant Panel */}
      <Col lg="4">
        <AIAssistantPanel 
          systemData={{
            name: systemForm.name,
            description: systemForm.description,
            systemType: systemForm.systemType,
            dataTypes: systemForm.dataTypes,
            // ... other form data
          }}
          onAIResult={(aiResult) => {
            // Auto-populate form with AI suggestions
            setSystemForm(prev => ({
              ...prev,
              confidentialityImpact: aiResult.confidentiality,
              integrityImpact: aiResult.integrity,
              availabilityImpact: aiResult.availability,
              overallImpact: aiResult.overall
            }));
          }}
          disabled={!systemForm.name || !systemForm.description}
        />
      </Col>
    </Row>
    
    {/* YOUR EXISTING SAVE BUTTONS STAY THE SAME */}
    <div className="form-group mt-4">
      <Button 
        color="primary" 
        onClick={handleSaveSystem}
        disabled={!systemForm.name || !systemForm.description || !systemForm.systemType}
      >
        <Icon name="check"></Icon>
        <span>Add System</span>
      </Button>
      <Button color="light" className="ms-2" onClick={() => setAddSystemModal(false)}>
        Cancel
      </Button>
    </div>
  </ModalBody>
</Modal>

// NEW COMPONENT: AI Assistant Panel
const AIAssistantPanel = ({ systemData, onAIResult, disabled }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showReasoning, setShowReasoning] = useState(false);

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const result = await rmfAIApi.categorizeSystem(systemData);
      setAiResult(result.data.categorization);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <PreviewCard className="h-100">
      <div className="card-inner">
        <div className="card-title-group mb-3">
          <div className="card-title">
            <h6 className="title">
              <Icon name="cpu" className="me-2"></Icon>
              AI Assistant
            </h6>
          </div>
        </div>

        {!aiResult ? (
          <div className="text-center">
            <p className="text-soft mb-3">
              Get AI-powered FIPS 199 categorization analysis
            </p>
            <Button 
              color="primary" 
              size="sm"
              onClick={handleAIAnalysis}
              disabled={disabled || aiLoading}
            >
              {aiLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <Icon name="cpu" className="me-2"></Icon>
                  Analyze System
                </>
              )}
            </Button>
          </div>
        ) : (
          <div>
            {/* AI Results Display */}
            <div className="mb-3">
              <h6 className="mb-2">AI Analysis Results</h6>
              <div className="d-flex align-items-center mb-2">
                <span className="text-soft me-2">Confidence:</span>
                <div className="progress flex-grow-1 me-2" style={{height: '6px'}}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{width: `${aiResult.confidence}%`}}
                  ></div>
                </div>
                <span className="text-success fw-bold">{aiResult.confidence}%</span>
              </div>
            </div>

            {/* Impact Levels */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-soft">Confidentiality:</span>
                <span className={`badge badge-${getImpactColor(aiResult.confidentiality)}`}>
                  {aiResult.confidentiality}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-soft">Integrity:</span>
                <span className={`badge badge-${getImpactColor(aiResult.integrity)}`}>
                  {aiResult.integrity}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-soft">Availability:</span>
                <span className={`badge badge-${getImpactColor(aiResult.availability)}`}>
                  {aiResult.availability}
                </span>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold">Overall Impact:</span>
                <span className={`badge badge-lg badge-${getImpactColor(aiResult.overall)}`}>
                  {aiResult.overall}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-grid gap-2">
              <Button 
                color="success" 
                size="sm"
                onClick={() => onAIResult(aiResult)}
              >
                <Icon name="check" className="me-2"></Icon>
                Apply AI Suggestions
              </Button>
              <Button 
                color="light" 
                size="sm"
                onClick={() => setShowReasoning(!showReasoning)}
              >
                <Icon name="info" className="me-2"></Icon>
                {showReasoning ? 'Hide' : 'Show'} Reasoning
              </Button>
            </div>

            {/* AI Reasoning (Collapsible) */}
            {showReasoning && (
              <div className="mt-3">
                <div className="alert alert-light">
                  <h6 className="alert-heading">AI Reasoning:</h6>
                  <p className="mb-0 small">{aiResult.reasoning}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PreviewCard>
  );
};

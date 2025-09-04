/**
 * RMF Wizard - Clean, Step-by-Step RMF Implementation
 * Breaks down the complex RMF process into manageable, focused steps
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import WizardContainer from "@/components/wizard/WizardContainer";
import { rmfProjectsApi } from "@/utils/rmfApi";

// Import step components
import ProjectSetupStep from "./wizard-steps/ProjectSetupStep";
import SystemIdentificationStep from "./wizard-steps/SystemIdentificationStep";
import SystemCategorizationStep from "./wizard-steps/SystemCategorizationStep";
import ControlSelectionStep from "./wizard-steps/ControlSelectionStep";
import ImplementationPlanStep from "./wizard-steps/ImplementationPlanStep";
import AssessmentPlanStep from "./wizard-steps/AssessmentPlanStep";
import AuthorizationStep from "./wizard-steps/AuthorizationStep";
import MonitoringStep from "./wizard-steps/MonitoringStep";

const RMFWizard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);

  // Define RMF wizard steps
  const rmfSteps = [
    {
      id: 'setup',
      title: 'Project Setup',
      subtitle: 'Basic project information',
      description: 'Define the project scope, timeline, and key stakeholders',
      icon: 'setting',
      component: ProjectSetupStep,
      validate: (data) => data?.name && data?.description && data?.owner
    },
    {
      id: 'identify',
      title: 'System Identification',
      subtitle: 'Define system boundaries',
      description: 'Identify and document the information system and its components',
      icon: 'grid',
      component: SystemIdentificationStep,
      validate: (data) => data?.systems && data.systems.length > 0
    },
    {
      id: 'categorize',
      title: 'Categorize',
      subtitle: 'FIPS 199 categorization',
      description: 'Categorize the information system based on impact levels',
      icon: 'layers',
      component: SystemCategorizationStep,
      validate: (data) => data?.categorization && data.categorization.confidentiality
    },
    {
      id: 'select',
      title: 'Select Controls',
      subtitle: 'Choose security controls',
      description: 'Select appropriate security controls based on categorization',
      icon: 'shield-check',
      component: ControlSelectionStep,
      validate: (data) => data?.controls && data.controls.length > 0
    },
    {
      id: 'implement',
      title: 'Implementation Plan',
      subtitle: 'Plan control implementation',
      description: 'Create detailed implementation plan for selected controls',
      icon: 'clipboard',
      component: ImplementationPlanStep,
      validate: (data) => data?.implementationPlan
    },
    {
      id: 'assess',
      title: 'Assessment Plan',
      subtitle: 'Plan security assessment',
      description: 'Develop plan for assessing implemented security controls',
      icon: 'check-circle',
      component: AssessmentPlanStep,
      validate: (data) => data?.assessmentPlan
    },
    {
      id: 'authorize',
      title: 'Authorization',
      subtitle: 'Risk acceptance decision',
      description: 'Obtain authorization to operate from authorizing official',
      icon: 'award',
      component: AuthorizationStep,
      validate: (data) => data?.authorizationDecision
    },
    {
      id: 'monitor',
      title: 'Continuous Monitoring',
      subtitle: 'Ongoing security monitoring',
      description: 'Establish continuous monitoring strategy and procedures',
      icon: 'activity',
      component: MonitoringStep,
      validate: (data) => data?.monitoringStrategy
    }
  ];

  // Load project data if editing existing project
  useEffect(() => {
    if (projectId && projectId !== 'new') {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const result = await rmfProjectsApi.getProject(projectId);
      if (result.success) {
        setProject(result.data);
      } else {
        toast.error('Failed to load project');
        navigate('/rmf/projects');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
      navigate('/rmf/projects');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle step change
   */
  const handleStepChange = (stepIndex, stepData) => {
    console.log(`📍 RMF Wizard - Step ${stepIndex + 1}:`, rmfSteps[stepIndex].title);
    console.log('Step data:', stepData);
  };

  /**
   * Handle wizard completion
   */
  const handleWizardComplete = async (allStepData) => {
    try {
      setLoading(true);
      console.log('🎉 RMF Wizard Complete!', allStepData);

      // Compile all step data into project format
      const projectData = {
        // Project setup data
        name: allStepData[0]?.name,
        description: allStepData[0]?.description,
        owner: allStepData[0]?.owner,
        dueDate: allStepData[0]?.dueDate,
        
        // System identification
        systems: allStepData[1]?.systems || [],
        
        // Categorization
        categorization: allStepData[2]?.categorization,
        
        // Control selection
        selectedControls: allStepData[3]?.controls || [],
        
        // Implementation plan
        implementationPlan: allStepData[4]?.implementationPlan,
        
        // Assessment plan
        assessmentPlan: allStepData[5]?.assessmentPlan,
        
        // Authorization
        authorizationDecision: allStepData[6]?.authorizationDecision,
        
        // Monitoring
        monitoringStrategy: allStepData[7]?.monitoringStrategy,
        
        // Status
        status: 'completed',
        currentStep: 'monitor'
      };

      let result;
      if (projectId && projectId !== 'new') {
        result = await rmfProjectsApi.updateProject(projectId, projectData);
      } else {
        result = await rmfProjectsApi.createProject(projectData);
      }

      if (result.success) {
        toast.success('RMF project completed successfully!');
        navigate('/rmf/projects');
      } else {
        toast.error('Failed to save project');
      }
    } catch (error) {
      console.error('Error completing wizard:', error);
      toast.error('Failed to complete RMF wizard');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle wizard cancellation
   */
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved progress will be lost.')) {
      navigate('/rmf/projects');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            
            {/* Page Header */}
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">
                    {projectId === 'new' ? 'New RMF Project' : 'Edit RMF Project'}
                  </h3>
                  <div className="nk-block-des text-soft">
                    <p>Follow the step-by-step wizard to complete your RMF implementation</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RMF Wizard */}
            <div className="nk-block">
              <WizardContainer
                steps={rmfSteps}
                onStepChange={handleStepChange}
                onComplete={handleWizardComplete}
                onCancel={handleCancel}
                showNavigation={true}
                showStepControls={true}
                allowSkipping={false}
                className="rmf-wizard"
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RMFWizard;

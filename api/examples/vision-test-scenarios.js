/**
 * Test Scenarios for GPT 4.1 Mini Vision Integration
 * IT Support scenarios with image analysis capabilities
 */

export const VisionTestScenarios = {
  // Error Screenshot Analysis
  errorAnalysis: {
    name: 'Error Screenshot Analysis',
    description: 'Customer uploads screenshot of system error',
    testMessage: 'Ho questo errore che appare quando avvio il programma. Potete aiutarmi?',
    mockImage: {
      type: 'image/png',
      name: 'error_screenshot.png',
      description: 'Screenshot showing Windows error dialog with "Application failed to initialize properly"',
      expectedAnalysis: {
        type: 'error_analysis',
        priority: 'high',
        escalation: false
      },
      expectedResponse: 'Vedo un errore di inizializzazione dell\'applicazione. Questo può essere causato da...'
    }
  },

  // Hardware Identification
  hardwareId: {
    name: 'Hardware Component Identification',
    description: 'Customer uploads photo of hardware component',
    testMessage: 'Questo componente del mio server ha iniziato a fare rumore. Cosa è?',
    mockImage: {
      type: 'image/jpeg',
      name: 'server_fan.jpg',
      description: 'Photo of server cooling fan with visible model number',
      expectedAnalysis: {
        type: 'hardware_identification',
        priority: 'medium',
        escalation: false
      },
      expectedResponse: 'Dal rumore e dall\'immagine, sembra che la ventola del server abbia bisogno di manutenzione...'
    }
  },

  // Network Diagram Analysis  
  networkAnalysis: {
    name: 'Network Configuration Analysis',
    description: 'Customer uploads network diagram for review',
    testMessage: 'La nostra rete ha problemi di velocità. Potete analizzare la configurazione?',
    mockImage: {
      type: 'image/png',
      name: 'network_diagram.png',
      description: 'Network topology diagram showing router, switches, and connected devices',
      expectedAnalysis: {
        type: 'network_analysis',
        priority: 'high',
        escalation: false
      },
      expectedResponse: 'Analizzando la topologia, vedo alcuni possibili colli di bottiglia nella configurazione...'
    }
  },

  // Security Alert
  securityIncident: {
    name: 'Security Alert Analysis',
    description: 'Customer uploads screenshot of security warning',
    testMessage: 'URGENTE: È apparso questo avviso di sicurezza, che devo fare?',
    mockImage: {
      type: 'image/png',
      name: 'security_alert.png',
      description: 'Screenshot of firewall security alert showing potential intrusion attempt',
      expectedAnalysis: {
        type: 'security_analysis',
        priority: 'immediate',
        escalation: true
      },
      expectedResponse: 'ATTENZIONE: Questo è un alert di sicurezza critico. Procedura immediata...'
    }
  },

  // Equipment Model Identification
  equipmentId: {
    name: 'Equipment Model Identification',
    description: 'Customer needs to identify device model',
    testMessage: 'Ho bisogno di sapere il modello esatto di questo router per scaricare i driver',
    mockImage: {
      type: 'image/jpeg',
      name: 'router_label.jpg',
      description: 'Photo of router showing model number and serial number labels',
      expectedAnalysis: {
        type: 'equipment_identification',
        priority: 'medium',
        escalation: false
      },
      expectedResponse: 'Dall\'etichetta visibile nell\'immagine, si tratta di un [Model] [Brand]. I driver sono disponibili...'
    }
  },

  // Multiple Images Test
  multipleImages: {
    name: 'Multiple Images Analysis',
    description: 'Customer uploads multiple related images',
    testMessage: 'Il mio computer ha questi problemi, ho fatto diverse foto',
    mockImages: [
      {
        type: 'image/jpeg',
        name: 'pc_front.jpg',
        description: 'Front view of desktop PC with power LED off'
      },
      {
        type: 'image/jpeg', 
        name: 'pc_back.jpg',
        description: 'Back view showing disconnected power cable'
      },
      {
        type: 'image/png',
        name: 'error_screen.png',
        description: 'Screen showing no boot device found error'
      }
    ],
    expectedAnalysis: {
      type: 'hardware_identification',
      priority: 'high',
      escalation: false
    },
    expectedResponse: 'Dalle immagini vedo che il problema potrebbe essere dovuto al cavo di alimentazione...'
  }
};

export const VisionTestUtils = {
  /**
   * Create mock image data for testing
   */
  createMockImage(scenario) {
    const mockImage = scenario.mockImage || scenario.mockImages[0];
    
    return {
      name: mockImage.name,
      type: mockImage.type,
      size: 2048000, // 2MB mock size
      dataUrl: `data:${mockImage.type};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`,
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      mockDescription: mockImage.description
    };
  },

  /**
   * Create test request payload
   */
  createTestRequest(scenarioName) {
    const scenario = VisionTestScenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Scenario ${scenarioName} not found`);
    }

    const images = scenario.mockImages ? 
      scenario.mockImages.map(img => this.createMockImage({ mockImage: img })) :
      [this.createMockImage(scenario)];

    return {
      action: 'message',
      message: scenario.testMessage,
      images: images,
      hasVision: true,
      sessionId: `test_${Date.now()}`,
      timestamp: Date.now()
    };
  },

  /**
   * Validate vision response
   */
  validateResponse(response, expectedAnalysis) {
    const validations = [];

    // Check if response is generated
    if (!response.success) {
      validations.push(`❌ Response failed: ${response.error}`);
      return validations;
    }

    // Check vision usage
    if (!response.visionUsed) {
      validations.push('⚠️ Vision analysis not detected in response');
    } else {
      validations.push('✅ Vision analysis detected');
    }

    // Check escalation
    if (expectedAnalysis.escalation !== response.escalate) {
      validations.push(`⚠️ Escalation mismatch: expected ${expectedAnalysis.escalation}, got ${response.escalate}`);
    } else {
      validations.push(`✅ Escalation correct: ${response.escalate}`);
    }

    // Check AI model usage
    if (response.aiPowered) {
      validations.push(`✅ AI model used: ${response.model || 'unknown'}`);
    } else {
      validations.push('❌ AI not used for response');
    }

    // Check response time
    if (response.responseTime > 5000) {
      validations.push(`⚠️ Slow response: ${response.responseTime}ms`);
    } else {
      validations.push(`✅ Response time: ${response.responseTime}ms`);
    }

    // Check cost
    if (response.cost > 0) {
      validations.push(`💰 Cost: €${response.cost.toFixed(6)}`);
    }

    return validations;
  },

  /**
   * Run comprehensive vision test
   */
  async runVisionTest(apiEndpoint, scenarioName = 'errorAnalysis') {
    console.log(`🧪 Running vision test: ${scenarioName}`);
    
    const testRequest = this.createTestRequest(scenarioName);
    const scenario = VisionTestScenarios[scenarioName];
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testRequest)
      });

      const result = await response.json();
      const validations = this.validateResponse(result, scenario.expectedAnalysis);
      
      console.log(`📊 Test Results for ${scenarioName}:`);
      validations.forEach(validation => console.log(`  ${validation}`));
      
      if (result.success && result.response) {
        console.log(`💬 AI Response: "${result.response.substring(0, 100)}..."`);
      }
      
      return {
        scenario: scenarioName,
        success: result.success,
        validations,
        response: result.response,
        visionUsed: result.visionUsed,
        cost: result.cost || 0,
        responseTime: result.responseTime || 0
      };

    } catch (error) {
      console.error(`❌ Vision test failed: ${error.message}`);
      return {
        scenario: scenarioName,
        success: false,
        error: error.message,
        validations: [`❌ Network/API error: ${error.message}`]
      };
    }
  },

  /**
   * Run all vision test scenarios
   */
  async runAllTests(apiEndpoint) {
    console.log('🚀 Running comprehensive vision test suite...\n');
    
    const results = [];
    const scenarios = Object.keys(VisionTestScenarios);
    
    for (const scenario of scenarios) {
      const result = await this.runVisionTest(apiEndpoint, scenario);
      results.push(result);
      console.log(''); // Add spacing between tests
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;
    
    console.log('📈 Vision Test Suite Summary:');
    console.log(`✅ Successful tests: ${successful}/${results.length}`);
    console.log(`💰 Total cost: €${totalCost.toFixed(6)}`);
    console.log(`⏱️ Average response time: ${Math.round(avgResponseTime)}ms`);
    console.log(`👁️ Vision analysis usage: ${results.filter(r => r.visionUsed).length}/${results.length}`);
    
    return results;
  }
};

// Export for use in tests
export default { VisionTestScenarios, VisionTestUtils };
import React from 'react';
import { Shield, Eye, Lock, AlertTriangle, X } from 'lucide-react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Privacy Policy & Terms of Use</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* Disclaimer */}
          <section className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-amber-600 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900 mb-3">Important Disclaimer</h3>
                <div className="text-amber-800 space-y-3 text-sm">
                  <p>
                    <strong>Educational Use Only:</strong> This application is designed for educational purposes only. 
                    The AI-generated responses are based on historical documents and should not be considered as 
                    authoritative historical facts or religious doctrine.
                  </p>
                  <p>
                    <strong>AI Limitations:</strong> The AI may occasionally generate inaccurate, inappropriate, or 
                    biased content. All conversations should be supervised by educators and used as a starting point 
                    for further research and discussion.
                  </p>
                  <p>
                    <strong>Religious Sensitivity:</strong> This application may discuss religious figures and topics. 
                    Users should approach these conversations with respect and understanding that different faith 
                    traditions may have varying perspectives.
                  </p>
                  <p>
                    <strong>Supervision Required:</strong> Students under 18 must use this application under adult 
                    supervision. Teachers and parents should review conversations for appropriateness.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy Policy */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="h-5 w-5 text-blue-600 mr-2" />
              Privacy Policy
            </h3>
            
            <div className="space-y-6 text-sm text-gray-700">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. Information We Collect</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>PDF documents uploaded for character creation (processed locally)</li>
                  <li>Chat messages and conversation history (stored in browser session only)</li>
                  <li>Voice recordings for speech-to-text conversion (processed and discarded immediately)</li>
                  <li>OpenAI API key (stored securely in browser session only)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. How We Use Your Information</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>To create AI character profiles from uploaded documents</li>
                  <li>To generate contextual responses during conversations</li>
                  <li>To provide voice-to-text and text-to-speech functionality</li>
                  <li>To generate educational images when requested</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. Data Storage and Security</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>No Server Storage:</strong> All data is processed and stored locally in your browser</li>
                  <li><strong>Session Only:</strong> Data is automatically deleted when you close the browser</li>
                  <li><strong>No Tracking:</strong> We do not use cookies, analytics, or tracking technologies</li>
                  <li><strong>Secure Transmission:</strong> All API communications use HTTPS encryption</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">4. Third-Party Services</h4>
                <p className="mb-2">This application uses OpenAI's services:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>GPT-4:</strong> For generating AI responses</li>
                  <li><strong>DALL-E 3:</strong> For image generation</li>
                  <li><strong>Text-to-Speech:</strong> For voice synthesis</li>
                  <li>Your data is subject to <a href="https://openai.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">OpenAI's Privacy Policy</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">5. Australian Privacy Compliance</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Compliant with the Australian Privacy Act 1988</li>
                  <li>Follows Australian Government Information Security Manual (ISM) guidelines</li>
                  <li>Suitable for use in Australian educational institutions</li>
                  <li>No personal information is collected or stored beyond the browser session</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">6. Student Privacy Protection</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>No student personal information is required or collected</li>
                  <li>Conversations are not monitored, recorded, or stored by our systems</li>
                  <li>Teachers can export conversation transcripts for educational review</li>
                  <li>Compliant with Children's Online Privacy Protection requirements</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">7. Your Rights</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Right to access: All your data is visible in the application interface</li>
                  <li>Right to deletion: Clear browser data or close the application</li>
                  <li>Right to portability: Export conversation transcripts at any time</li>
                  <li>Right to object: Stop using the application at any time</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Terms of Use */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="h-5 w-5 text-green-600 mr-2" />
              Terms of Use
            </h3>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Acceptable Use</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Use for educational and research purposes only</li>
                  <li>Respect intellectual property rights of uploaded materials</li>
                  <li>Do not attempt to generate inappropriate or harmful content</li>
                  <li>Follow your institution's IT and internet usage policies</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Prohibited Activities</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Uploading copyrighted materials without permission</li>
                  <li>Attempting to extract or reverse-engineer the AI models</li>
                  <li>Using the application for commercial purposes</li>
                  <li>Sharing API keys or attempting to access others' accounts</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Limitation of Liability</h4>
                <p>
                  This application is provided "as is" for educational purposes. We are not liable for 
                  any inaccuracies in AI-generated content or any consequences of using this application. 
                  Users are responsible for verifying information and using the tool appropriately.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Questions or Concerns?</h4>
            <p className="text-sm text-gray-700">
              For questions about privacy, data handling, or terms of use, please contact your 
              institution's IT department or the application administrator.
            </p>
          </section>

          <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>Last updated: {new Date().toLocaleDateString('en-AU')}</p>
            <p>This policy complies with Australian privacy laws and educational technology standards.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
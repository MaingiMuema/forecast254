'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaCheckCircle, FaUserClock, FaChartBar, FaBalanceScale } from 'react-icons/fa';
import ApplicationModal from '@/components/careers/ApplicationModal';

const CareersPage = () => {
  const [selectedRole, setSelectedRole] = useState<{ title: string; type: string; } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleApply = (role: { title: string; type: string; }) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const roles = [
    {
      title: "Market Validator",
      type: "Full-time / Part-time",
      location: "Remote",
      description: "Join our team of market validators responsible for ensuring the quality and accuracy of prediction markets on our platform.",
      responsibilities: [
        "Review and validate new market proposals",
        "Assess market clarity and resolution criteria",
        "Monitor market activity for potential issues",
        "Maintain detailed validation records",
        "Collaborate with the activation team"
      ],
      requirements: [
        "Strong analytical and critical thinking skills",
        "Excellent attention to detail",
        "Understanding of various market sectors (sports, politics, entertainment)",
        "Ability to work independently and meet deadlines",
        "Strong communication skills"
      ],
      benefits: [
        "Competitive compensation based on validation volume",
        "Performance bonuses",
        "Flexible working hours",
        "Professional development opportunities",
        "Access to premium platform features"
      ]
    },
    {
      title: "Market Resolution Specialist",
      type: "Full-time / Part-time",
      location: "Remote",
      description: "Join our team as a Market Resolution Specialist responsible for ensuring the accuracy of market resolutions and verifying auto-resolved markets across our platform.",
      responsibilities: [
        "Verify accuracy of auto-resolved market outcomes",
        "Review and confirm market resolution data",
        "Investigate disputed market resolutions",
        "Maintain detailed resolution audit trails",
        "Collaborate with validators and activators to ensure market integrity"
      ],
      requirements: [
        "Strong data verification and analytical skills",
        "Experience with data accuracy and validation",
        "Knowledge of various market sectors and outcome verification",
        "Excellent problem-solving abilities",
        "Strong attention to detail and documentation skills"
      ],
      benefits: [
        "Competitive compensation package",
        "Resolution accuracy bonuses",
        "Flexible remote work schedule",
        "Comprehensive training program",
        "Career growth opportunities"
      ]
    },
    {
      title: "Market Activator",
      type: "Full-time / Part-time",
      location: "Remote",
      description: "Be part of our market activation team, responsible for launching and monitoring prediction markets through their lifecycle.",
      responsibilities: [
        "Activate validated markets at optimal times",
        "Monitor market performance and engagement",
        "Track market progress and resolution",
        "Ensure accurate and timely market resolution",
        "Document market lifecycle and outcomes"
      ],
      requirements: [
        "Experience in market analysis or trading",
        "Strong time management skills",
        "Ability to work in a fast-paced environment",
        "Good understanding of market dynamics",
        "Detail-oriented with strong documentation skills"
      ],
      benefits: [
        "Performance-based compensation",
        "Market activation bonuses",
        "Flexible schedule",
        "Training and certification programs",
        "Career advancement opportunities"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeIn}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="flex justify-center mb-6">
              <FaChartLine className="text-5xl text-emerald-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Join the Future of Predictive Markets
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Help shape the future of prediction markets in Kenya by joining our team of market validators and activators.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Why Join Forecast254?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <FaUserClock className="text-3xl text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Flexible Work</h3>
                <p className="text-muted-foreground">Work remotely on your own schedule while contributing to innovative markets.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <FaChartBar className="text-3xl text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Growth Potential</h3>
                <p className="text-muted-foreground">Develop your skills and advance your career in the predictive markets industry.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <FaBalanceScale className="text-3xl text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Data Integrity</h3>
                <p className="text-muted-foreground">Ensure accuracy and fairness in market resolutions while building user trust.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 bg-background/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Open Positions</h2>
            <div className="space-y-8">
              {roles.map((role, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                  <div className="flex flex-col md:flex-row justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{role.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-emerald-400">{role.type}</span>
                        <span className="text-muted-foreground">{role.location}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleApply(role)}
                      className="mt-4 md:mt-0 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                    >
                      Apply Now
                    </button>
                  </div>
                  <p className="text-muted-foreground mb-6">{role.description}</p>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Key Responsibilities</h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {role.responsibilities.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <FaCheckCircle className="text-emerald-400 mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Requirements</h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {role.requirements.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <FaCheckCircle className="text-emerald-400 mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Benefits</h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {role.benefits.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <FaCheckCircle className="text-emerald-400 mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-6">Ready to Apply?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join our team and help shape the future of predictive markets in Kenya. 
              Submit your application today and be part of our innovative platform.
            </p>
            <button 
              onClick={() => handleApply({ title: "General Application", type: "Full-time / Part-time" })}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
            >
              Start Your Application
            </button>
          </motion.div>
        </div>
      </section>

      {/* Application Modal */}
      {selectedRole && (
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
        />
      )}
    </div>
  );
};

export default CareersPage;

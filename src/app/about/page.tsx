'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaChartLine, FaLightbulb, FaHandshake, FaGlobe, FaGithub, FaInstagram } from 'react-icons/fa';

const AboutPage = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const values = [
    {
      icon: <FaLightbulb className="text-3xl text-emerald-400" />,
      title: "Innovation",
      description: "Pioneering predictive markets in Africa with cutting-edge technology."
    },
    {
      icon: <FaHandshake className="text-3xl text-emerald-400" />,
      title: "Trust",
      description: "Building a transparent and secure platform for our community."
    },
    {
      icon: <FaGlobe className="text-3xl text-emerald-400" />,
      title: "Impact",
      description: "Empowering Kenyans to participate in and benefit from market predictions."
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
              Shaping the Future of Predictive Markets in Kenya
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Forecast254 is Kenya&apos;s premier predictive markets platform, combining cutting-edge technology
              with local market insights to create a unique trading experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">Our Mission</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <p className="text-lg text-muted-foreground leading-relaxed">
                At Forecast254, we&apos;re on a mission to democratize predictive markets in Kenya. 
                We believe in the power of collective intelligence and aim to create a platform 
                where Kenyans can leverage their knowledge and insights to participate in market 
                predictions across various sectors including sports, politics, entertainment, and more.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-background/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 text-center"
                >
                  <div className="flex justify-center mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Meet Our Founder</h2>
            <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="w-48 h-48 relative rounded-full overflow-hidden border-4 border-emerald-400/20">
                <Image
                  src="/images/founder.jpeg"
                  alt="Mark Maingi"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="hover:scale-110 transition-transform duration-300"
                  priority
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Mark Maingi</h3>
                <p className="text-emerald-400 font-medium mb-4">Founder & Lead Developer</p>
                <p className="text-muted-foreground mb-6">
                  A passionate developer and entrepreneur with a vision to revolutionize predictive markets in Kenya.
                  Mark combines his technical expertise with market insights to build innovative solutions that empower traders.
                </p>
                <div className="flex justify-center md:justify-start gap-4">
                  <a
                    href="https://github.com/MaingiMuema"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FaGithub className="text-2xl" />
                  </a>
                  <a
                    href="https://www.instagram.com/diffusion.gen/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FaInstagram className="text-2xl" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-8">Our Team</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our team consists of passionate individuals with diverse backgrounds in 
                finance, technology, and market analysis. We combine local market expertise 
                with technical innovation to deliver a world-class predictive markets platform 
                tailored for Kenya.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="py-16 bg-background/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-6">Join Our Journey</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Be part of the future of predictive markets in Kenya. Join our growing community 
              of traders and market enthusiasts.
            </p>
            <a
              href="/markets"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
            >
              Start Trading Now
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Clock, Target, ArrowRight, CheckCircle, Zap, Users, Award, Star, Lightbulb } from 'lucide-react';
import BizModelAILogo from './BizModelAILogo';

interface LandingPageProps {
  onStartQuiz: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartQuiz }) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const fallDown = {
    initial: { opacity: 0, y: -100 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header 
        className="bg-white shadow-sm relative z-10 rounded-b-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <BizModelAILogo size="lg" showText={true} />
            
            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1">Home</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">Explore Business Ideas</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">Take Quiz</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">Success Stories</a>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          {/* Top Badge */}
          <motion.div 
            className="inline-flex items-center bg-blue-800/30 backdrop-blur-sm border border-blue-600/30 rounded-full px-6 py-3 mb-12"
            variants={fallDown}
            initial="initial"
            animate="animate"
          >
            <Star className="h-5 w-5 text-blue-300 mr-2" />
            <span className="text-blue-200 font-medium">AI-Powered Business Model Discovery</span>
          </motion.div>
          
          {/* Main Headlines with Falling Animation */}
          <motion.div
            variants={fallDown}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-2 leading-tight">
              Discover Your Perfect
            </h1>
          </motion.div>
          
          <motion.div
            variants={fallDown}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-12 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Business Model
              </span>
            </h1>
          </motion.div>
          
          {/* Subtitle */}
          <motion.p 
            className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed"
            variants={fallDown}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Skip the guesswork and find your ideal business model. Our AI analyzes your skills, goals, and preferences to deliver personalized recommendations that match your unique situation.
          </motion.p>
          
          {/* CTA Button and Time */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
            variants={fallDown}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <button
              onClick={onStartQuiz}
              className="group bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-10 py-5 rounded-full text-xl font-bold hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center"
            >
              <Zap className="h-6 w-6 mr-3" />
              Discover Your Path
              <ArrowRight className="inline-block ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
            
            <div className="flex items-center text-blue-300">
              <Clock className="h-5 w-5 mr-2" />
              <span className="text-lg">Takes 10-15 minutes</span>
            </div>
          </motion.div>
          
          {/* Social Proof Stats */}
          <motion.div 
            className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto"
            variants={fallDown}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <div className="flex items-center justify-center">
              <Brain className="h-8 w-8 text-blue-400 mr-4" />
              <div className="text-left">
                <div className="text-2xl font-bold text-white">AI-Powered</div>
                <div className="text-blue-300">personality matching</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <Target className="h-8 w-8 text-green-400 mr-4" />
              <div className="text-left">
                <div className="text-2xl font-bold text-white">18+</div>
                <div className="text-blue-300">business models analyzed</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <Star className="h-8 w-8 text-yellow-400 mr-4" />
              <div className="text-left">
                <div className="text-2xl font-bold text-white">4.9/5</div>
                <div className="text-blue-300">average rating</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Ombre Fade Transition */}
      <div className="h-32 bg-gradient-to-b from-indigo-900 via-indigo-700 to-gray-50"></div>

      {/* Problem Section */}
      <motion.div 
        className="py-24 bg-gray-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6" variants={fadeInUp}>
              Tired of Endless Research?
            </motion.h2>
            <motion.p className="text-xl text-gray-600 max-w-3xl mx-auto" variants={fadeInUp}>
              You've watched the YouTube videos, read the blog posts, and bookmarked dozens of "make money online" guides. But you're still stuck asking: "What's actually right for ME?"
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 mb-16"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Clock,
                title: "Analysis Paralysis",
                description: "Too many options, not enough clarity on what fits your situation"
              },
              {
                icon: Target,
                title: "Generic Advice",
                description: "One-size-fits-all solutions that don't consider your unique circumstances"
              },
              {
                icon: Zap,
                title: "Wasted Time",
                description: "Months of research without taking action or seeing results"
              }
            ].map((problem, index) => (
              <motion.div 
                key={index}
                className="text-center p-8 bg-white rounded-2xl shadow-lg"
                variants={fadeInUp}
              >
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <problem.icon className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{problem.title}</h3>
                <p className="text-gray-600">{problem.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Solution Section */}
      <motion.div 
        className="py-24 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6" variants={fadeInUp}>
              Your Personalized Business GPS
            </motion.h2>
            <motion.p className="text-xl text-gray-600 max-w-3xl mx-auto" variants={fadeInUp}>
              Get a custom roadmap based on your goals, time, skills, and personality—not generic advice
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Brain,
                title: "Smart Assessment",
                description: "50+ intelligent questions that adapt based on your answers to understand your unique situation",
                color: "blue"
              },
              {
                icon: Target,
                title: "AI Matching",
                description: "Advanced algorithms analyze your profile against proven business models to find your best fits",
                color: "green"
              },
              {
                icon: TrendingUp,
                title: "Ranked Results",
                description: "Get your top business matches with detailed fit scores, timelines, and earning potential",
                color: "purple"
              },
              {
                icon: Award,
                title: "Action Plans",
                description: "Step-by-step roadmaps with tools, resources, and milestones to start making money fast",
                color: "orange"
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className={`text-center p-8 rounded-3xl bg-gradient-to-br from-${feature.color}-50 to-${feature.color}-100 hover:from-${feature.color}-100 hover:to-${feature.color}-200 transition-all duration-300 transform hover:scale-105`}
                variants={fadeInUp}
              >
                <div className={`w-16 h-16 bg-${feature.color}-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Social Proof Section */}
      <motion.div 
        className="py-24 bg-gradient-to-br from-gray-50 to-blue-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.h2 className="text-4xl font-bold text-gray-900 mb-4" variants={fadeInUp}>
              Join 25,000+ People Who Stopped Overthinking
            </motion.h2>
            <motion.p className="text-xl text-gray-600" variants={fadeInUp}>
              Real results from people who took action
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8 mb-12"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { 
                name: "Sarah M.", 
                result: "Started affiliate marketing, $4.2K first month", 
                time: "2 weeks ago",
                avatar: "👩‍💼"
              },
              { 
                name: "Mike R.", 
                result: "Launched freelance writing, $6K/month", 
                time: "1 month ago",
                avatar: "👨‍💻"
              },
              { 
                name: "Lisa K.", 
                result: "Created online course, $12K launch", 
                time: "3 weeks ago",
                avatar: "👩‍🎓"
              }
            ].map((testimonial, index) => (
              <motion.div 
                key={index} 
                className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300"
                variants={fadeInUp}
              >
                <div className="flex items-center mb-6">
                  <div className="text-3xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="font-bold text-gray-900">{testimonial.name}</span>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 font-medium">{testimonial.result}</p>
                <p className="text-sm text-gray-500">{testimonial.time}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center bg-white px-8 py-4 rounded-full shadow-lg">
              <Users className="h-6 w-6 text-blue-600 mr-3" />
              <span className="text-lg font-semibold text-gray-900">25,000+ successful matches made</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        className="py-24 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.h2 
              className="text-4xl md:text-6xl font-bold text-white mb-6"
              variants={fadeInUp}
            >
              Ready to Stop Guessing?
            </motion.h2>
            <motion.p 
              className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed"
              variants={fadeInUp}
            >
              Take our intelligent quiz and get your personalized business roadmap in under 5 minutes
            </motion.p>
            
            <motion.div className="space-y-6" variants={fadeInUp}>
              <button
                onClick={onStartQuiz}
                className="group bg-white text-blue-600 px-12 py-6 rounded-full text-xl font-bold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
              >
                Start Your Personalized Quiz
                <ArrowRight className="inline-block ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
              
              <div className="flex flex-wrap justify-center gap-6 text-blue-200 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Takes 3-5 minutes</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Completely free to start</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Instant results</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
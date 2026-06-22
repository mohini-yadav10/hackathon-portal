import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { User, Link2, Globe, Briefcase, Plus, X, Award, CheckCircle } from 'lucide-react';

const Profile = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    college: '',
    branch: '',
    year: 1,
    github_url: '',
    linkedin_url: '',
    bio: '',
    skills: [],
    interests: []
  });
  
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profiles');
      const data = res.data.data;
      setProfileData({
        name: data.name || '',
        email: data.email || '',
        college: data.college || '',
        branch: data.branch || '',
        year: data.year || 1,
        github_url: data.github_url || '',
        linkedin_url: data.linkedin_url || '',
        bio: data.bio || '',
        skills: data.skills || [],
        interests: data.interests || []
      });
    } catch (err) {
      console.error('Error fetching profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !profileData.skills.includes(skillInput.trim())) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleAddInterest = (e) => {
    e.preventDefault();
    if (interestInput.trim() && !profileData.interests.includes(interestInput.trim())) {
      setProfileData(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }));
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interestToRemove)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await api.put('/profiles', {
        college: profileData.college,
        branch: profileData.branch,
        year: parseInt(profileData.year),
        github_url: profileData.github_url,
        linkedin_url: profileData.linkedin_url,
        bio: profileData.bio,
        skills: profileData.skills,
        interests: profileData.interests
      });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100">
      <Navbar title="My Profile" />
      <Sidebar />

      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-white">Student Profile Settings</h2>
            <p className="text-slate-400 text-sm mt-1">Keep your profile updated so team leaders can find and invite you.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8">
              {successMsg && (
                <div className="p-4 bg-green-500/10 border border-green-500/35 rounded-2xl flex items-center gap-3 text-green-400 text-sm font-semibold">
                  <CheckCircle size={18} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Basic Academic Info */}
              <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Briefcase size={20} className="text-accent" />
                  <span>Academic Details</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      disabled
                      className="w-full glass-input px-4 py-3 rounded-xl text-sm bg-slate-800/40 border-slate-800 text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Email (Read Only)</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full glass-input px-4 py-3 rounded-xl text-sm bg-slate-800/40 border-slate-800 text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">College Name</label>
                    <input
                      type="text"
                      name="college"
                      value={profileData.college}
                      onChange={handleInputChange}
                      className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                      placeholder="e.g. IIT Bombay"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Branch / Major</label>
                    <input
                      type="text"
                      name="branch"
                      value={profileData.branch}
                      onChange={handleInputChange}
                      className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                      placeholder="e.g. Computer Science"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Year of Study</label>
                    <select
                      name="year"
                      value={profileData.year}
                      onChange={handleInputChange}
                      className="w-full glass-input px-4 py-3 rounded-xl text-sm bg-slate-900"
                      required
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                      <option value={5}>5th Year</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bio & Social Links */}
              <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <User size={20} className="text-accent" />
                  <span>Developer Bio & Links</span>
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Short Bio</label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm resize-none"
                    placeholder="Tell us about your developer experience, stacks you like, and what kind of teams you're looking to join..."
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                      <Link2 size={14} />
                      <span>GitHub URL</span>
                    </label>
                    <input
                      type="url"
                      name="github_url"
                      value={profileData.github_url}
                      onChange={handleInputChange}
                      className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                      placeholder="https://github.com/your-username"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                      <Globe size={14} />
                      <span>LinkedIn URL</span>
                    </label>
                    <input
                      type="url"
                      name="linkedin_url"
                      value={profileData.linkedin_url}
                      onChange={handleInputChange}
                      className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                      placeholder="https://linkedin.com/in/your-username"
                    />
                  </div>
                </div>
              </div>

              {/* Skills & Interests Tags */}
              <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Award size={20} className="text-accent" />
                  <span>Skills & Interests (DBMS Normalization Demonstration)</span>
                </h3>

                {/* Skills Block */}
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Technical Skills</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      className="flex-grow glass-input px-4 py-2.5 rounded-xl text-sm"
                      placeholder="Add skill (e.g. React, Node.js, Python, MySQL)"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-accent hover:bg-accent/80 text-white p-2.5 rounded-xl transition flex items-center justify-center"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {profileData.skills.length === 0 ? (
                      <span className="text-xs text-slate-500 pl-1">No skills added yet.</span>
                    ) : (
                      profileData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-accent/15 border border-accent/25 text-accent px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-slate-400 hover:text-red-400 transition"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Interests Block */}
                <div className="space-y-4 pt-4 border-t border-slate-800/40">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Domain Interests</label>
                  <div className="flex gap-2">
                    <select
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      className="flex-grow glass-input px-4 py-2.5 rounded-xl text-sm bg-slate-900"
                    >
                      <option value="">Select Domain...</option>
                      <option value="Web Development">Web Development</option>
                      <option value="App Development">App Development</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Cyber Security">Cyber Security</option>
                      <option value="Blockchain">Blockchain</option>
                      <option value="Cloud Computing">Cloud Computing</option>
                      <option value="DBMS">DBMS</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddInterest}
                      className="bg-accent hover:bg-accent/80 text-white p-2.5 rounded-xl transition flex items-center justify-center"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {profileData.interests.length === 0 ? (
                      <span className="text-xs text-slate-500 pl-1">No domain interests added yet.</span>
                    ) : (
                      profileData.interests.map((interest) => (
                        <span
                          key={interest}
                          className="bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
                        >
                          <span>{interest}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveInterest(interest)}
                            className="text-slate-400 hover:text-red-400 transition"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-accent hover:bg-accent/80 text-white font-bold px-8 py-3.5 rounded-2xl transition shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  {saving ? 'Saving Settings...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;

import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { User, Link2, Globe, Briefcase, Plus, X, Award, CheckCircle, Upload, FileText, Loader2, Image as ImageIcon } from 'lucide-react';

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
    interests: [],
    profile_pic_path: '',
    resume_path: ''
  });

  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // File upload states
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);

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
        interests: data.interests || [],
        profile_pic_path: data.profile_pic_path || '',
        resume_path: data.resume_path || ''
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
    const input = skillInput.trim();
    if (!input) return;

    // Case-insensitive duplicate check
    const isDuplicate = profileData.skills.some(
      s => s.toLowerCase() === input.toLowerCase()
    );

    if (!isDuplicate) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, input]
      }));
      setSkillInput('');
    } else {
      setErrorMsg('This skill is already added');
      setTimeout(() => setErrorMsg(''), 3000);
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
    const input = interestInput.trim();
    if (!input) return;

    // Case-insensitive duplicate check
    const isDuplicate = profileData.interests.some(
      i => i.toLowerCase() === input.toLowerCase()
    );

    if (!isDuplicate) {
      setProfileData(prev => ({
        ...prev,
        interests: [...prev.interests, input]
      }));
      setInterestInput('');
    } else {
      setErrorMsg('This domain interest is already added');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interestToRemove)
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.post('/profiles/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfileData(prev => ({
        ...prev,
        profile_pic_path: res.data.profile_pic_path
      }));
      setSuccessMsg('Profile picture updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload profile picture');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    setResumeLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.post('/profiles/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfileData(prev => ({
        ...prev,
        resume_path: res.data.resume_path
      }));
      setSuccessMsg('Resume uploaded successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload resume');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setResumeLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
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
      setSuccessMsg('Profile settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Failed to update profile settings');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  // Helper to build full file url from backend paths
  const getFullUrl = (path) => {
    if (!path) return '';
    const baseUrl = import.meta.env.VITE_API_URL || 'https://hackathon-portal-production.up.railway.app';
    return `${baseUrl}${path}`;
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
            <div className="space-y-8">
              {successMsg && (
                <div className="p-4 bg-green-500/10 border border-green-500/35 rounded-2xl flex items-center gap-3 text-green-400 text-sm font-semibold">
                  <CheckCircle size={18} />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/35 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-semibold">
                  <X size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Profile Image & Resume Upload Panel */}
              <div className="glass-panel p-6 rounded-3xl border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Profile Pic Upload */}
                <div className="flex flex-col items-center justify-center p-4 border border-slate-800 rounded-2xl bg-slate-800/20">
                  <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-accent/40 bg-slate-900 flex items-center justify-center mb-4">
                    {profileData.profile_pic_path ? (
                      <img
                        src={getFullUrl(profileData.profile_pic_path)}
                        alt="Profile avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                    ) : (
                      <User size={36} className="text-slate-500" />
                    )}
                    {avatarLoading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 size={20} className="text-accent animate-spin" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2">
                    <ImageIcon size={14} />
                    <span>Change Profile Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarLoading} />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-2">Max file size 2MB. Supports PNG, JPG, JPEG.</p>
                </div>

                {/* Resume Upload */}
                <div className="flex flex-col items-center justify-center p-4 border border-slate-800 rounded-2xl bg-slate-800/20">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <FileText size={24} className="text-accent" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 mb-1">Resume / CV Document</h4>
                  {profileData.resume_path ? (
                    <a
                      href={getFullUrl(profileData.resume_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline mb-4 flex items-center gap-1.5"
                    >
                      <span>View Current Resume</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <p className="text-xs text-slate-500 mb-4">No resume uploaded yet</p>
                  )}
                  <label className="cursor-pointer bg-accent hover:bg-accent/80 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2">
                    {resumeLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    <span>Upload Resume</span>
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} disabled={resumeLoading} />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-2">Max file size 5MB. Supports PDF, DOC, DOCX.</p>
                </div>
              </div>

              {/* Text fields Form */}
              <form onSubmit={handleSave} className="space-y-8">
                
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;

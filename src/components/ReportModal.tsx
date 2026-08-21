import React, { useState, useRef, useEffect } from 'react';
import { IncidentSeverity, RoadAccessibility, DrainProblemType } from '../types';
import { X, Camera, MapPin, AlertTriangle, ShieldCheck, CheckCircle2, Upload, Mic, Square, Play, Trash2, Volume2, Radio } from 'lucide-react';
import { triggerHapticFeedback } from '../services/mobileUtils';

interface ReportModalProps {
  initialType?: 'flood' | 'blocked_drain';
  isOpen: boolean;
  onClose: () => void;
  userLat: number;
  userLng: number;
  onSubmitReport: (reportData: any) => void;
  isOffline: boolean;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  initialType = 'flood',
  isOpen,
  onClose,
  userLat,
  userLng,
  onSubmitReport,
  isOffline,
}) => {
  if (!isOpen) return null;

  const [reportType, setReportType] = useState<'flood' | 'blocked_drain'>(initialType);
  const [suburb, setSuburb] = useState<string>('Circle');
  const [address, setAddress] = useState<string>('Near VIP Bus Terminal, Nkrumah Circle');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [waterDepthCm, setWaterDepthCm] = useState<number>(35);
  const [roadPassable, setRoadPassable] = useState<RoadAccessibility>('caution');
  const [housesAffected, setHousesAffected] = useState<boolean>(true);
  const [drainType, setDrainType] = useState<DrainProblemType>('blocked_gutter');
  const [description, setDescription] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('');
  const [reporterPhone, setReporterPhone] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Audio Recording State for Non-Literate / Voice Reporting Citizens
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Voice recording handlers
  const startVoiceRecording = async () => {
    triggerHapticFeedback(30);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioBlobUrl(url);
          // Stop all mic tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => {
            if (prev >= 60) {
              stopVoiceRecording();
              return 60;
            }
            return prev + 1;
          });
        }, 1000);
      } else {
        // Fallback simulated recording if mic access is restricted in iframe
        setIsRecording(true);
        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => {
            if (prev >= 15) {
              stopVoiceRecordingSimulated();
              return 15;
            }
            return prev + 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.warn('Microphone access blocked or restricted. Switching to voice note simulator.');
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 12) {
            stopVoiceRecordingSimulated();
            return 12;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopVoiceRecordingSimulated = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setAudioDuration(recordingSeconds || 12);
    // Standard audio data URL or fallback sample voice note sound
    setAudioBlobUrl('https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg');
    triggerHapticFeedback(40);
  };

  const stopVoiceRecording = () => {
    triggerHapticFeedback(40);
    if (timerRef.current) clearInterval(timerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      stopVoiceRecordingSimulated();
    }
    setIsRecording(false);
    setAudioDuration(recordingSeconds || 10);
  };

  const deleteVoiceNote = () => {
    triggerHapticFeedback(20);
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlobUrl(null);
    setAudioDuration(0);
    setRecordingSeconds(0);
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current || !audioBlobUrl) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const speakAudioInstructions = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = "Akyerɛw koraa ho nhia. Bɔ mic fitaa krado yi so kyere wo nne gu mu. Kyere faako a nsuo no aka ne sɛnea ɛreborɔ.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalDesc = description.trim();

    // If citizen recorded voice note instead of typing text description
    if (!finalDesc) {
      if (audioBlobUrl) {
        finalDesc = `🎤 Voice Recording Report Attached (${audioDuration || recordingSeconds || 12}s voice note). Citizen reported flooding via direct voice audio in local language (Twi/Ga/English).`;
      } else {
        alert('Please either type a short description OR record a voice audio note.');
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      onSubmitReport({
        type: reportType,
        latitude: userLat,
        longitude: userLng,
        address: address || `${suburb}, Accra`,
        suburb,
        severity,
        waterDepthCm: reportType === 'flood' ? waterDepthCm : 0,
        roadPassable,
        housesAffected,
        drainProblemType: reportType === 'blocked_drain' ? drainType : undefined,
        description: finalDesc,
        reporterName: isAnonymous ? 'Anonymous Citizen' : (reporterName || 'Ghana Citizen (Voice Report)'),
        reporterPhone: isAnonymous ? '' : reporterPhone,
        isAnonymous,
        imageUrl: photoPreview,
        audioUrl: audioBlobUrl,
        hasVoiceNote: !!audioBlobUrl,
      });

      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border-2 border-black w-full max-w-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden my-8">
        
        {/* Header Bar */}
        <div className="bg-black px-6 py-4 flex items-center justify-between border-b-2 border-black">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-yellow-400 font-bold">CITIZEN INCIDENT REPORTING</span>
            <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
              {reportType === 'flood' ? '🚨 Submit Flood Incident' : '🕳️ Submit Blocked Drain Report'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-white hover:text-yellow-400 border border-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-black mx-auto animate-bounce" />
            <h3 className="text-xl font-black uppercase text-black">Report Successfully Submitted!</h3>
            <p className="text-xs font-bold text-zinc-700 uppercase">
              {isOffline ? 'Saved to local offline queue. Will auto-sync to NADMO when network returns.' : 'Report sent to verification engine and nearby response authorities.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            
            {/* Special Accessibility Callout Banner for Non-Literate Citizens */}
            <div className="bg-amber-400 border-2 border-black p-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3">
              <div className="p-2 bg-black text-yellow-400 border border-black shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div className="text-xs text-black">
                <div className="font-black uppercase flex items-center justify-between gap-2">
                  <span>Voice Note Report (No Typing Needed / Kasa kyerɛ yɛn)</span>
                  <button
                    type="button"
                    onClick={speakAudioInstructions}
                    className="text-[10px] bg-black text-white px-2 py-0.5 rounded border border-black hover:bg-zinc-800 shrink-0"
                    title="Listen in Twi"
                  >
                    🔊 Twi Audio Guide
                  </button>
                </div>
                <p className="font-bold text-zinc-900 mt-0.5 leading-snug">
                  If you cannot write or type, simply record your voice in <strong className="underline">Twi, Ga, Ewe, or English</strong>. Describe where the water is and how high it has reached.
                </p>
              </div>
            </div>

            {/* Voice Audio Recording Module */}
            <div className="bg-zinc-50 border-2 border-black p-4 space-y-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-red-600" />
                  <span>Audio Voice Message Attachment</span>
                </label>
                {audioBlobUrl && (
                  <span className="text-[10px] font-black uppercase bg-emerald-400 text-black px-2 py-0.5 border border-black">
                    ✓ Voice Note Ready
                  </span>
                )}
              </div>

              {!audioBlobUrl ? (
                <div className="text-center py-2 space-y-3">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 transition-transform active:scale-98"
                    >
                      <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                      <span>Tap to Record Voice Report</span>
                    </button>
                  ) : (
                    <div className="space-y-3 bg-red-50 border-2 border-red-600 p-4">
                      <div className="flex items-center justify-between text-xs font-black text-red-600 uppercase">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                          Recording Voice... (Speak in Twi / Ga / English)
                        </span>
                        <span className="font-mono text-sm">00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}s</span>
                      </div>

                      {/* Visual Sound Waveform animation */}
                      <div className="flex items-end justify-center gap-1 h-8">
                        <div className="w-1.5 bg-red-600 animate-[bounce_0.6s_infinite_100ms] h-full" />
                        <div className="w-1.5 bg-red-600 animate-[bounce_0.6s_infinite_200ms] h-3/4" />
                        <div className="w-1.5 bg-red-600 animate-[bounce_0.6s_infinite_300ms] h-full" />
                        <div className="w-1.5 bg-red-600 animate-[bounce_0.6s_infinite_150ms] h-2/3" />
                        <div className="w-1.5 bg-red-600 animate-[bounce_0.6s_infinite_250ms] h-full" />
                      </div>

                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white font-black uppercase text-xs tracking-widest border border-black flex items-center justify-center gap-2"
                      >
                        <Square className="w-4 h-4 text-yellow-400" />
                        <span>Stop & Save Voice Note</span>
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] font-bold text-zinc-600">
                    Max 60 seconds. High priority for rescue authorities.
                  </p>
                </div>
              ) : (
                /* Voice Player Component */
                <div className="bg-white border-2 border-black p-3 space-y-2">
                  <audio
                    ref={audioPlayerRef}
                    src={audioBlobUrl}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={togglePlayAudio}
                        className="p-2.5 bg-yellow-400 text-black border-2 border-black font-black hover:bg-yellow-300 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      >
                        {isPlayingAudio ? <Square className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                      </button>
                      <div>
                        <div className="text-xs font-black uppercase text-black">Voice Note Attached</div>
                        <div className="text-[10px] font-bold text-zinc-600 font-mono">
                          Duration: {audioDuration || 12} seconds
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={deleteVoiceNote}
                      className="p-2 text-red-600 hover:text-red-700 border border-black bg-red-50"
                      title="Delete voice note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Type Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 border-2 border-black">
              <button
                type="button"
                onClick={() => setReportType('flood')}
                className={`py-2 text-xs font-black uppercase border border-black transition-all ${
                  reportType === 'flood' ? 'bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-black hover:bg-zinc-200'
                }`}
              >
                🌊 Flood Incident
              </button>
              <button
                type="button"
                onClick={() => setReportType('blocked_drain')}
                className={`py-2 text-xs font-black uppercase border border-black transition-all ${
                  reportType === 'blocked_drain' ? 'bg-yellow-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-black hover:bg-zinc-200'
                }`}
              >
                🕳️ Blocked Drain
              </button>
            </div>

            {/* GPS Location & Suburb */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">Suburb / Area (Accra)</label>
                <select
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  className="w-full bg-white text-black text-xs font-bold uppercase p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <option value="Circle">Kwame Nkrumah Circle</option>
                  <option value="Alajo">Alajo & Onyasia Basin</option>
                  <option value="Kaneshie">Kaneshie Market Area</option>
                  <option value="Odawna">Odawna Community</option>
                  <option value="Darkuman">Darkuman Junction</option>
                  <option value="Dansoman">Dansoman / Glefe</option>
                  <option value="Spintex">Spintex Road Underpass</option>
                  <option value="Weija">Weija / Mallam</option>
                  <option value="Tema">Tema Community</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">Landmark / Address</label>
                <input
                  type="text"
                  placeholder="e.g., Near VIP Terminal / School gutter"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white text-black text-xs font-bold p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>

            {/* Severity Radio Group */}
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">Severity Level</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['LOW', 'MODERATE', 'HIGH', 'SEVERE'] as IncidentSeverity[]).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 px-2 text-center border-2 border-black text-xs font-black uppercase transition-all ${
                      severity === sev
                        ? sev === 'SEVERE'
                          ? 'bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : sev === 'HIGH'
                          ? 'bg-orange-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-yellow-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-black hover:bg-zinc-100'
                    }`}
                  >
                    {sev === 'SEVERE' ? '🔴 SEVERE' : sev === 'HIGH' ? '🟠 HIGH' : sev === 'MODERATE' ? '🟡 MODERATE' : '🟢 MINOR'}
                  </button>
                ))}
              </div>
            </div>

            {/* Flood Specific: Water depth & Road accessibility */}
            {reportType === 'flood' ? (
              <div className="space-y-3 bg-zinc-50 p-3.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-black uppercase text-black">Estimated Depth</span>
                    <span className="font-mono font-black text-orange-600">{waterDepthCm} cm (~{(waterDepthCm / 30).toFixed(1)} ft)</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="5"
                    value={waterDepthCm}
                    onChange={(e) => setWaterDepthCm(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-black uppercase text-black mb-1">Road Passable?</label>
                    <select
                      value={roadPassable}
                      onChange={(e: any) => setRoadPassable(e.target.value)}
                      className="w-full bg-white text-black text-xs font-bold uppercase p-2 border-2 border-black"
                    >
                      <option value="caution">⚠️ Caution Required</option>
                      <option value="no">🚫 Impassable / Closed</option>
                      <option value="yes">✅ Fully Passable</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-5">
                    <input
                      type="checkbox"
                      id="houses"
                      checked={housesAffected}
                      onChange={(e) => setHousesAffected(e.target.checked)}
                      className="w-4 h-4 border-2 border-black text-black focus:ring-0"
                    />
                    <label htmlFor="houses" className="text-xs text-black font-black uppercase cursor-pointer">
                      Homes inundated
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* Blocked Drain Specific */
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">Drain Issue Type</label>
                <select
                  value={drainType}
                  onChange={(e: any) => setDrainType(e.target.value)}
                  className="w-full bg-white text-black text-xs font-bold uppercase p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <option value="garbage_overflow">🚮 Garbage & Plastics Blocking Gutter</option>
                  <option value="blocked_gutter">🧱 Silt / Weeds Blocking Channel</option>
                  <option value="collapsed_culvert">🏗️ Collapsed Culvert / Slab</option>
                  <option value="missing_cover">⚠️ Missing Drain Cover / Open Pit</option>
                  <option value="damaged_infrastructure">🛠️ Broken Drainage Wall</option>
                </select>
              </div>
            )}

            {/* Optional Written Description */}
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">
                Written Description (Optional if Voice Note Recorded)
              </label>
              <textarea
                rows={2}
                placeholder="Optionally write details if you can..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white text-black text-xs font-bold p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            {/* Photo Attachment */}
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">Photo Evidence (Optional)</label>
              <div className="flex items-center gap-3">
                {photoPreview ? (
                  <div className="relative w-20 h-20 border-2 border-black shrink-0">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-1 right-1 bg-black text-white p-0.5 border border-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-black p-3 text-center w-full bg-zinc-50">
                    <Camera className="w-5 h-5 text-black mx-auto mb-1" />
                    <span className="text-[10px] font-black uppercase text-black">Attach photo from mobile camera</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reporter Contact & Anonymous Option */}
            <div className="border-t-2 border-black pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-black">Submit Anonymously?</span>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 border-2 border-black text-black focus:ring-0"
                />
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name (Optional)"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="bg-white text-black text-xs font-bold p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <input
                    type="tel"
                    placeholder="Ghana Phone Number"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    className="bg-white text-black text-xs font-bold p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? (
                <span>Validating & Submitting...</span>
              ) : (
                <span>🚀 Submit Official Report</span>
              )}
            </button>

          </form>
        )}

      </div>
    </div>
  );
};

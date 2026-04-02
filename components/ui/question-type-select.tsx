"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageSquareText, CircleCheck, CheckSquare, Star } from "lucide-react";
import { QUESTION_TYPE_OPTIONS } from "@/lib/survey";
import { SurveyQuestionType } from "@/lib/types";

interface QuestionTypeSelectProps {
  value: SurveyQuestionType;
  onChange: (value: SurveyQuestionType) => void;
}

const ICON_MAP = {
  text: <MessageSquareText className="w-4 h-4" />,
  single_select: <CircleCheck className="w-4 h-4" />,
  multi_select: <CheckSquare className="w-4 h-4" />,
  rating: <Star className="w-4 h-4" />,
};

export function QuestionTypeSelect({ value, onChange }: QuestionTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = QUESTION_TYPE_OPTIONS.find((opt) => opt.value === value) || QUESTION_TYPE_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 bg-white/[0.03] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md rounded-xl px-4 py-3 text-sm text-zinc-200 transition-all hover:bg-white/[0.05] hover:border-white/20 outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="text-[#42D293] opacity-80">
            {ICON_MAP[value as keyof typeof ICON_MAP]}
          </div>
          <span className="font-medium">{selectedOption.label}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 z-[100] mt-1 overflow-hidden rounded-2xl border border-white/15 bg-[#09120d]/95 backdrop-blur-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/5"
          >
            <div className="p-1.5">
              {QUESTION_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all duration-200 ${
                    value === option.value
                      ? "bg-[#42D293]/10 text-[#42D293]"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className={value === option.value ? "text-[#42D293]" : "text-zinc-500"}>
                    {ICON_MAP[option.value as keyof typeof ICON_MAP]}
                  </div>
                  <span className="font-medium">{option.label}</span>
                  {value === option.value && (
                    <motion.div
                      layoutId="select-indicator"
                      className="ml-auto w-1 h-1 rounded-full bg-[#42D293] shadow-[0_0_8px_#42D293]"
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

package com.resumeflow.backend.dto;

public class AnswerRequestDto {
    private int question_number;
    private String question_text;
    private String answer;

    public int getQuestion_number() { return question_number; }
    public void setQuestion_number(int question_number) { this.question_number = question_number; }

    public String getQuestion_text() { return question_text; }
    public void setQuestion_text(String question_text) { this.question_text = question_text; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
}

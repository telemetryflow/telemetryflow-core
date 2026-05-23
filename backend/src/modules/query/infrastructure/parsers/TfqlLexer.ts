import { Injectable } from '@nestjs/common';
import {
  Token,
  TokenType,
  TfqlLexerError,
  TFQL_KEYWORDS,
} from '../../domain/types/tfql.types';

/**
 * TFQL Lexer (Tokenizer)
 * Converts raw query string into a stream of tokens
 */
@Injectable()
export class TfqlLexer {
  private input: string = '';
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  /**
   * Tokenize input string into array of tokens
   */
  tokenize(input: string): Token[] {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;

    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      const token = this.nextToken();
      if (token) {
        // Skip whitespace and comments for AST, but keep for debugging
        if (token.type !== TokenType.WHITESPACE && token.type !== TokenType.COMMENT) {
          tokens.push(token);
        }
      }
    }

    tokens.push(this.createToken(TokenType.EOF, ''));
    return tokens;
  }

  private nextToken(): Token | null {
    this.skipWhitespace();

    if (this.isAtEnd()) {
      return null;
    }

    const char = this.peek();

    // Comments
    if (char === '#' || (char === '-' && this.peekNext() === '-')) {
      return this.scanComment();
    }

    // String literals
    if (char === '"' || char === "'") {
      return this.scanString();
    }

    // Numbers (including durations like 5m, 1h)
    if (this.isDigit(char)) {
      return this.scanNumber();
    }

    // Identifiers and keywords
    if (this.isAlpha(char) || char === '_') {
      return this.scanIdentifier();
    }

    // Operators and punctuation
    return this.scanOperator();
  }

  private scanComment(): Token {
    const startPos = this.position;
    const startCol = this.column;

    // Skip comment start
    if (this.peek() === '#') {
      this.advance();
    } else {
      this.advance(); // -
      this.advance(); // -
    }

    // Read until end of line
    while (!this.isAtEnd() && this.peek() !== '\n') {
      this.advance();
    }

    const value = this.input.slice(startPos, this.position);
    return this.createTokenAt(TokenType.COMMENT, value, startPos, this.line, startCol);
  }

  private scanString(): Token {
    const startPos = this.position;
    const startCol = this.column;
    const quote = this.advance(); // Opening quote

    let value = '';
    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance(); // Skip escape char
        if (!this.isAtEnd()) {
          const escaped = this.advance();
          switch (escaped) {
            case 'n': value += '\n'; break;
            case 't': value += '\t'; break;
            case 'r': value += '\r'; break;
            case '\\': value += '\\'; break;
            case '"': value += '"'; break;
            case "'": value += "'"; break;
            default: value += escaped;
          }
        }
      } else if (this.peek() === '\n') {
        throw new TfqlLexerError(
          'Unterminated string literal',
          this.line,
          this.column,
          this.position,
        );
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new TfqlLexerError(
        'Unterminated string literal',
        this.line,
        startCol,
        startPos,
      );
    }

    this.advance(); // Closing quote
    return this.createTokenAt(TokenType.STRING, value, startPos, this.line, startCol);
  }

  private scanNumber(): Token {
    const startPos = this.position;
    const startCol = this.column;

    // Integer part
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      this.advance();
    }

    // Decimal part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // .
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        this.advance();
      }
    }

    // Check for duration suffix (s, m, h, d, w, M, y)
    const durationSuffixes = ['s', 'm', 'h', 'd', 'w', 'M', 'y'];
    if (durationSuffixes.includes(this.peek())) {
      this.advance();
      const value = this.input.slice(startPos, this.position);
      return this.createTokenAt(TokenType.DURATION, value, startPos, this.line, startCol);
    }

    // Scientific notation
    if (this.peek() === 'e' || this.peek() === 'E') {
      this.advance();
      if (this.peek() === '+' || this.peek() === '-') {
        this.advance();
      }
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.input.slice(startPos, this.position);
    return this.createTokenAt(TokenType.NUMBER, value, startPos, this.line, startCol);
  }

  private scanIdentifier(): Token {
    const startPos = this.position;
    const startCol = this.column;

    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const value = this.input.slice(startPos, this.position);

    // Check if it's a keyword
    const keyword = TFQL_KEYWORDS[value] || TFQL_KEYWORDS[value.toUpperCase()];
    const type = keyword || TokenType.IDENTIFIER;

    return this.createTokenAt(type, value, startPos, this.line, startCol);
  }

  private scanOperator(): Token {
    const startPos = this.position;
    const startCol = this.column;
    const char = this.advance();

    switch (char) {
      case '(':
        return this.createTokenAt(TokenType.LPAREN, char, startPos, this.line, startCol);
      case ')':
        return this.createTokenAt(TokenType.RPAREN, char, startPos, this.line, startCol);
      case '{':
        return this.createTokenAt(TokenType.LBRACE, char, startPos, this.line, startCol);
      case '}':
        return this.createTokenAt(TokenType.RBRACE, char, startPos, this.line, startCol);
      case '[':
        return this.createTokenAt(TokenType.LBRACKET, char, startPos, this.line, startCol);
      case ']':
        return this.createTokenAt(TokenType.RBRACKET, char, startPos, this.line, startCol);
      case ',':
        return this.createTokenAt(TokenType.COMMA, char, startPos, this.line, startCol);
      case '.':
        return this.createTokenAt(TokenType.DOT, char, startPos, this.line, startCol);
      case ':':
        return this.createTokenAt(TokenType.COLON, char, startPos, this.line, startCol);
      case ';':
        return this.createTokenAt(TokenType.SEMICOLON, char, startPos, this.line, startCol);

      case '=':
        if (this.peek() === '~') {
          this.advance();
          return this.createTokenAt(TokenType.TILDE, '=~', startPos, this.line, startCol);
        }
        return this.createTokenAt(TokenType.EQUALS, char, startPos, this.line, startCol);

      case '!':
        if (this.peek() === '=') {
          this.advance();
          return this.createTokenAt(TokenType.NOT_EQUALS, '!=', startPos, this.line, startCol);
        }
        if (this.peek() === '~') {
          this.advance();
          return this.createTokenAt(TokenType.NOT_TILDE, '!~', startPos, this.line, startCol);
        }
        throw new TfqlLexerError(`Unexpected character: ${char}`, this.line, startCol, startPos);

      case '>':
        if (this.peek() === '=') {
          this.advance();
          return this.createTokenAt(TokenType.GREATER_EQ, '>=', startPos, this.line, startCol);
        }
        return this.createTokenAt(TokenType.GREATER, char, startPos, this.line, startCol);

      case '<':
        if (this.peek() === '=') {
          this.advance();
          return this.createTokenAt(TokenType.LESS_EQ, '<=', startPos, this.line, startCol);
        }
        return this.createTokenAt(TokenType.LESS, char, startPos, this.line, startCol);

      case '~':
        return this.createTokenAt(TokenType.TILDE, char, startPos, this.line, startCol);

      case '\n':
        this.line++;
        this.column = 1;
        return this.createTokenAt(TokenType.NEWLINE, char, startPos, this.line - 1, startCol);

      default:
        throw new TfqlLexerError(`Unexpected character: ${char}`, this.line, startCol, startPos);
    }
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.advance();
        this.line++;
        this.column = 1;
      } else {
        break;
      }
    }
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.input[this.position];
  }

  private peekNext(): string {
    if (this.position + 1 >= this.input.length) return '\0';
    return this.input[this.position + 1];
  }

  private advance(): string {
    const char = this.input[this.position];
    this.position++;
    this.column++;
    return char;
  }

  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
           char === '_';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private createToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column,
      position: this.position,
    };
  }

  private createTokenAt(
    type: TokenType,
    value: string,
    position: number,
    line: number,
    column: number,
  ): Token {
    return {
      type,
      value,
      line,
      column,
      position,
    };
  }
}

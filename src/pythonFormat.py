# ponytail: tokenize rebuild, 4-space indent. Not black — won't wrap lines or touch f-strings.
import ast
import io
import tokenize

_KEYWORDS = {
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del',
    'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in',
    'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while',
    'with', 'yield', 'match', 'case',
}
_FSTRING_START = getattr(tokenize, 'FSTRING_START', None)
_FSTRING_END = getattr(tokenize, 'FSTRING_END', None)


def _value(tok):
    if tok.type in (tokenize.NUMBER, tokenize.STRING) or tok.type == _FSTRING_END:
        return True
    if tok.string in (')', ']', '}'):
        return True
    if tok.string == '...':
        return True
    if tok.type == tokenize.NAME and tok.string not in _KEYWORDS:
        return True
    return False


def _raw(text, start, end):
    lines = text.split('\n')
    sl, sc = start
    el, ec = end
    if sl == el:
        return lines[sl - 1][sc:ec]
    parts = [lines[sl - 1][sc:]]
    for line in range(sl, el - 1):
        parts.append('\n' + lines[line])
    parts.append('\n' + lines[el - 1][:ec])
    return ''.join(parts)


def format_python(src):
    text = str(src or '').replace('\r\n', '\n').replace('\r', '\n')
    if not text.strip():
        return ''
    if not text.endswith('\n'):
        text += '\n'
    try:
        ast.parse(text)
        tokens = list(tokenize.generate_tokens(io.StringIO(text).readline))
    except (tokenize.TokenError, IndentationError, SyntaxError) as exc:
        message = getattr(exc, 'msg', None) or str(exc)
        raise SyntaxError(message) from None
    out = []
    indent = 0
    stack = []
    at_start = True
    line_level = 0
    prev = None
    prev_prefix = False
    prev_slice = False
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        kind = tok.type
        if kind in (tokenize.ENCODING, tokenize.ENDMARKER, tokenize.INDENT, tokenize.DEDENT):
            if kind == tokenize.INDENT:
                indent += 1
            elif kind == tokenize.DEDENT:
                indent = max(0, indent - 1)
            i += 1
            continue
        if kind in (tokenize.NEWLINE, tokenize.NL):
            out.append('\n')
            at_start = True
            prev = None
            prev_prefix = False
            prev_slice = False
            i += 1
            continue
        if _FSTRING_START and kind == _FSTRING_START:
            start = tok.start
            depth = 1
            end_tok = tok
            i += 1
            while depth and i < len(tokens):
                end_tok = tokens[i]
                if end_tok.type == _FSTRING_START:
                    depth += 1
                elif end_tok.type == _FSTRING_END:
                    depth -= 1
                i += 1
            piece = _raw(text, start, end_tok.end)
            if at_start:
                line_level = stack[-1][1] + 1 if stack else indent
                out.append('    ' * line_level)
                at_start = False
            elif prev is not None:
                out.append(_gap(prev, tok, prev_prefix, prev_slice))
            out.append(piece)
            prev = end_tok
            prev_prefix = False
            prev_slice = False
            continue
        closing = tok.string in ')]}'
        if at_start:
            if stack:
                line_level = stack[-1][1] if closing else stack[-1][1] + 1
            else:
                line_level = indent
            out.append('    ' * line_level)
            at_start = False
        elif prev is not None:
            out.append(_gap(prev, tok, prev_prefix, prev_slice))
        out.append(tok.string)
        prefix = tok.string in ('*', '**', '+', '-', '~', '@') and (prev is None or not _value(prev))
        if tok.string in '([{':
            stack.append((tok.string, line_level))
        elif closing and stack:
            stack.pop()
        prev = tok
        prev_prefix = prefix
        prev_slice = tok.string == ':' and bool(stack) and stack[-1][0] == '['
        i += 1
    return ''.join(out).rstrip() + '\n'


def _gap(prev, tok, prev_prefix, prev_slice):
    if prev_prefix:
        return ''
    ps, ts = prev.string, tok.string
    if ts in ')]}.:,;':
        return ''
    if ps in '([{.':
        return ''
    if ps == ',' or ps == ';':
        return ' '
    if ps == ':':
        return '' if prev_slice else ' '
    if ts in ('(', '[') and _value(prev):
        return ''
    if tok.type == tokenize.COMMENT:
        return '  '
    return ' '


if __name__ == '__main__':
    assert format_python('a=1+2') == 'a = 1 + 2\n'
    assert format_python('def f():\n  return -1\n') == 'def f():\n    return -1\n'
    assert format_python('x = 1  # note\n') == 'x = 1  # note\n'
    assert format_python('s = "a  # not"\n') == 's = "a  # not"\n'
    assert format_python("f'{a+1}'\n") == "f'{a+1}'\n"
    try:
        format_python('if True:\npass\n')
    except SyntaxError:
        pass
    else:
        raise SystemExit('expected a syntax error')

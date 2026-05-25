import json
import os
import codecs

transcript_path = r'C:\Users\ayush\.gemini\antigravity\brain\180522b3-b563-4ce8-91cb-353e34c4b893\.system_generated\logs\transcript.jsonl'
files_to_restore = [
    'dashboard_screen.dart',
    'login_screen.dart',
    'practice_screen.dart',
    'recitation_screen.dart'
]

contents = {}

with codecs.open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
            tool_calls = step.get('tool_calls', [])
            for tc in tool_calls:
                name = tc.get('name', '')
                if name.endswith('write_to_file'):
                    args = tc.get('args', {})
                    target_file = args.get('TargetFile', '')
                    if isinstance(target_file, str):
                        target_file = target_file.strip('\"')
                    code_content = args.get('CodeContent', '')
                    if isinstance(code_content, str):
                        code_content = code_content.strip('\"')
                        try:
                            code_content = json.loads('\"' + code_content + '\"')
                        except Exception:
                            pass
                    for fname in files_to_restore:
                        if target_file.endswith(fname):
                            contents[fname] = code_content
        except Exception as e:
            pass

for fname, content in contents.items():
    if content:
        content = content.replace('Colors.emerald', 'Colors.teal')
        content = content.replace('FontWeight.black', 'FontWeight.w900')
        content = content.replace('MainAxisAlignment.between', 'MainAxisAlignment.spaceBetween')
        
        target_file = os.path.join(r'C:\Users\ayush\Desktop\projects\study_app\study_app\mobile\lib\screens', fname)
        with codecs.open(target_file, 'w', encoding='utf-8') as out:
            out.write(content)
        print('Restored and fixed: ' + target_file)

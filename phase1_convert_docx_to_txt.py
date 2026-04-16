import os
import json
from docx import Document

class DOCXConverter:
    def __init__(self, docx_path, json_mapping_path):
        self.docx_path = docx_path
        self.json_mapping_path = json_mapping_path

    def convert_to_txt(self):
        document = Document(self.docx_path)
        txt_content = []
        for paragraph in document.paragraphs:
            txt_content.append(paragraph.text)
        return '\n'.join(txt_content)

    def save_txt_file(self, txt_path):
        txt_content = self.convert_to_txt()
        with open(txt_path, 'w', encoding='utf-8') as txt_file:
            txt_file.write(txt_content)

    def create_json_mapping(self, txt_path):
        mapping = {"docx_file": self.docx_path, "txt_file": txt_path}
        with open(self.json_mapping_path, 'w', encoding='utf-8') as json_file:
            json.dump(mapping, json_file, ensure_ascii=False, indent=4)

if __name__ == '__main__':
    docx_file_path = 'path/to/your/file.docx'
    txt_file_path = 'path/to/your/output/file.txt'
    json_mapping_file_path = 'path/to/json/mapping.json'

    converter = DOCXConverter(docx_file_path, json_mapping_file_path)
    converter.save_txt_file(txt_file_path)
    converter.create_json_mapping(txt_file_path)
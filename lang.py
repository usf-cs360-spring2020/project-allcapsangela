import csv
import requests
from bs4 import BeautifulSoup


def get_family(iso, line_count):
    r = requests.get('https://glottolog.org/glottolog?iso=' + iso)
    soup = BeautifulSoup(r.text, 'html.parser')
    #print(soup.prettify())

    if r.status_code != 200:
        print(r.headers)
        print (line_count)
        print(iso)

    emessage = soup.find("div", {"class" : "alert alert-error"})

    if emessage == None :
        family = soup.find("span", {"class" : "level-family"})
        if family != None :
            return family.get_text()
        else:
            print(r.headers)
            print(line_count)
            print(iso)
            return ""
    else:
        return ""

#results = {}
#headers = {}

with open('Extinct-Languages-Processed2.csv', mode='r', encoding='utf-8') as csv_file, open('Extinct-Languages-Processed-Final.csv', mode='w', encoding='utf-8') as csv_out:
    csv_reader = csv.DictReader(csv_file)
    writer = csv.writer(csv_out, delimiter=",", lineterminator="\n")
    line_count = 0
    for row in csv_reader:
        line_count += 1
        if line_count == 1:
            writer.writerow(row.keys())
        else:
            #print(line_count)
            for key, value in row.items():
                if "\n" in value:
                    row[key] = '"' + value + '"'
                    #print(row[key])
                if key == "ISO639-3Code":
                    iso_code = row.get("ISO639-3Code")
                    if iso_code != "" :
                        if "," in iso_code:
                            code_list = iso_code.split(', ')
                            have_code = False
                            while not have_code:
                                for code in code_list:
                                    family = get_family(code, line_count)
                                    #family=""
                                    if family != "":
                                        row["TopLevelFamily"] = family
                                have_code = True
                                break
                        else:
                            row["TopLevelFamily"] = get_family(iso_code, line_count)
                            #row["TopLevelFamily"] = ""
                #check if has a comma
            row["Opacity"] = 1;
            row["IsChecked"] = "true";
            row["IsUnderMax"] = "true";
            writer.writerow(row.values())
        if line_count % 50 == 0:
            print(line_count)
            print(iso_code)

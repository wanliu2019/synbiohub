import requests, difflib, sys
import re
import argparse
from bs4 import BeautifulSoup

def test_print(string):
    sys.stdout.write("[synbiohub test] ")
    sys.stdout.write(string)
    sys.stdout.write("\n")


parser = argparse.ArgumentParser()

parser.add_argument("--resetalltests", help="reset all tests for requests by saving responses for future comparisons. Should only be run if working on the test suite implementation itself and all tests have passed.",
                    action = "store_true")

parser.add_argument("--serveraddress",
                    help="specify the synbiohub server to test.",
                    default = "http://localhost:7777/")

args = parser.parse_args()

# format it with a slash if the slash is missing
if args.serveraddress[-1] != '/':
    args.serveraddress = args.serveraddress + '/'

number_of_errors = 0


if args.resetalltests:
    test_print("resetting all tests by saving every request for future comparisons. You should not have run this unless you are working on the test suite implementation itself and have verified that all tests passed before the reset.")


# make html a little more human readable
def format_html(htmlstring):
    soup = BeautifulSoup(htmlstring, 'lxml')
    
    return soup.prettify()

# perform a get request
def get_request(request):
    response = requests.get(args.serveraddress + request)
    
    response.raise_for_status()
    
    content = format_html(response.text)

    return content

# data is the data field for a request
def post_request(request, data):
    response = requests.post(agrs.serveraddress + request, data = data)
    response.raise_for_status()
    
    content = format_html(response.text)
    return content

# perform and save a get request in previous results
def save_get_request(request):
    content = get_request(request)

    filepath = 'previousresults/getrequest_' + request + '.html'
    
    with open(filepath, 'w') as rfile:
        rfile.write(content)

# creates a file path for a given request and request type
def request_file_path(request, requesttype):
    return 'previousresults/' + requesttype.replace(" ", "") + "_" + request + ".html"
        
# check a request against previous results
# request should the page that was requested, such as /setup
# requesttype is the type of request performed, either "get request" or "post request"
def compare_request(requestcontent, request, requesttype):
    # if the global state is to replace all files, do that
    if args.resetalltests:
        with open(request_file_path(request, requesttype), 'w') as rfile:
            rfile.write(requestcontent)
    else:
        
        filepath = request_file_path(request, requesttype)
        
        olddata = None
        try:
            with open (filepath, "r") as oldfile:
                olddata=oldfile.read()
        except IOError as e:
            raise Exception("\n[synbiohub test] Could not open previous result for the " + \
                        requesttype + " " + request + ". If the saved result has not yet been created because it is a new page, please use TODO to create the file.") from e

        olddata = olddata.splitlines()
        newdata = requestcontent.splitlines()
        
        changes = difflib.unified_diff(olddata, newdata)

        # temp variable to detect if we need to print the beginning of the error
        firstchangep = True
        
        for c in changes:
            if firstchangep:
                test_print(requesttype + " " + request + " did not match previous results. If you are adding changes to SynBioHub that change this page, please check that the page is correct and update the file using TODO.\nThe following is a diff of the new files compared to the old.\n")
                global number_of_errors
                number_of_errors += 1
                firstchangep = False

            # print the diff
            sys.stdout.write(c)
            sys.stdout.write("\n")

    
# request- string, the name of the page being requested
def compare_get_request(request):
    if request[0] == '/':
        request = request[1:]
    compare_request(get_request(request), request, "get request")

# request- string, the name of the page being requested
# data- data to send in the post request
def compare_post_request(request, data):
    if request[0] == '/':
        request = request[1:]
    compare_request(post_request(request, data), request, "post request")
    
def exit_tests():
    # finally, if there were any errors, raise an Exception
    if number_of_errors > 0:
        raise ValueError("[synbiohub test] " + str(number_of_errors) + " tests failed.")



function renderDropdownCases(branchname,filteredData){
  filteredData?.forEach(function (item) {
    var option = document.createElement("option");
    const fileName = item?.split('.md')[0];
    option.text = fileName;
  });
  renderCases(branchname,filteredData[0]?.split('.md')[0]);
}

function renderCases(branchName,file) {
fetch(
`https://raw.githubusercontent.com/ondc-official/ONDC-FIS-Specifications/${branchName}/api/components/docs/${file}.md`
)
.then((response) => response.text())
.then((text) => {
const html = marked.parse(text);
document.getElementById("logSubmission-container").innerHTML = html;
});
}
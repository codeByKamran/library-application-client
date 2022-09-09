import { AppBar, Box, Button, Grid, TextField, Toolbar } from "@mui/material";
import { Add } from "@mui/icons-material";
import Heading from "../../components/Generic/Heading";
import Container from "../../components/Generic/Layout/Container";
import StudentsTable from "../../components/Generic/Table";
import Dialog from "../../components/Generic/Dialog";
import { useEffect, useState } from "react";
import Text from "../../components/Generic/Text";
import { useSnackbar } from "notistack";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { studentsTableColumns } from "../../static/studentsTableColumns";
import dashify from "dashify";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useSelector } from "react-redux";
import { selectUserType } from "../../redux/slices/userSlice";

const Students = () => {
  const [addNewDialogOpen, setAddNewDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [posting, setPosting] = useState(false);
  const [students, setStudents] = useState([]);
  const [tableData, setTableData] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const userType = useSelector(selectUserType);

  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  // react-query get all students
  const { isLoading, refetch: fetchStudents } = useQuery(
    "query-students",
    async () => {
      return await axiosPrivate.get(`/api/v1/students`);
    },
    {
      enabled: false,
      onSuccess: (res) => {
        console.log("Get all students response", res);
        setStudents(res.data.found);
        const tableData = res.data.found.map((row, i) => ({
          id: i + 1,
          rollNo: row.rollNo,
          firstName: row.firstName,
          lastName: row.lastName,
          class: row.class,
        }));
        setTableData(tableData);
        setPosting(false);
      },
      onError: (err) => {
        const statusText = err.response.statusText;
        setPosting(false);
        enqueueSnackbar(statusText, {
          variant: "error",
        });
      },
    }
  );

  useEffect(() => {
    fetchStudents();
  }, [posting, fetchStudents]);

  // react-query post student
  const { mutate: postStudent } = useMutation(
    async (studentData) => {
      return await axiosPrivate.post("/api/v1/students", studentData);
    },
    {
      onSuccess: async (res) => {
        console.log("Post student response", res);
        await fetchStudents();
        queryClient.invalidateQueries("query-students");
        enqueueSnackbar(res.statusText, {
          variant: "success",
        });
        resetForm();
        setPosting(false);
        setAddNewDialogOpen(false);
      },
      onError: (err) => {
        const statusText = err.response.statusText;
        setPosting(false);
        enqueueSnackbar(statusText, {
          variant: "error",
        });
      },
    }
  );

  const handleSaveStudent = async () => {
    if (firstName === "" || lastName === "") {
      enqueueSnackbar("First name & last name are required", {
        variant: "warning",
      });
    } else {
      setPosting(true);
      const slug = dashify(`${firstName} ${lastName}`);
      postStudent({
        firstName,
        lastName,
        class: studentClass,
        slug,
      });
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setStudentClass("");
  };

  const handleStudentClick = (student) => {
    const slug = students?.filter((stu) => stu.rollNo === student.row.rollNo)[0]
      .slug;
    navigate(slug);
  };

  return (
    <div>
      <Container maxWidth={false}>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar
            position="static"
            className="mt-8 rounded-md"
            color="secondary"
          >
            <Toolbar className="flex items-center">
              <Heading type="tertiary">Students</Heading>
              {userType === "Admin" && (
                <div className="appBar__right flex-1 flex justify-end">
                  <Button
                    color="primary"
                    variant="contained"
                    endIcon={<Add />}
                    onClick={() => setAddNewDialogOpen(true)}
                  >
                    Add Student
                  </Button>
                </div>
              )}
            </Toolbar>
          </AppBar>
        </Box>
        <main className="mt-2">
          <StudentsTable
            columns={studentsTableColumns}
            tableData={tableData}
            loading={isLoading}
            onRowClick={handleStudentClick}
          />
        </main>
      </Container>
      <Dialog
        dialogTitle="Add New Student"
        open={addNewDialogOpen}
        setOpen={setAddNewDialogOpen}
        confirmAction={handleSaveStudent}
        confirmActionLabel={posting ? "Adding..." : "Add Student"}
        discardActionLabel="Discard"
      >
        {/* Dialog Content */}
        <div>
          <div className="pb-5">
            <Text>Fill in info and hit Add New</Text>
          </div>
          <Grid container columnSpacing={2} rowSpacing={2}>
            <Grid item sx={12}>
              <TextField
                autoFocus
                id="first-name"
                label="First Name"
                fullWidth
                variant="outlined"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Grid>
            <Grid item sx={12}>
              <TextField
                id="last-name"
                label="Last Name"
                fullWidth
                variant="outlined"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Grid>
            <Grid item sx={12}>
              <TextField
                id="class-name"
                label="Class"
                fullWidth
                variant="outlined"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
              />
            </Grid>
            <Grid item sx={12} md={6} lg={3}></Grid>
          </Grid>
        </div>
      </Dialog>
    </div>
  );
};

export default Students;

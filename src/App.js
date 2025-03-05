import React, { useState, useEffect } from 'react';
import './App.css';
import 'antd/dist/antd.css';
import { Form, Input, InputNumber, Switch, Button, Row, DatePicker, Col, Select, notification, Spin, Table, Avatar } from 'antd';
import moment from 'moment';
import axios from 'axios'; 

const { Option } = Select;
const { TextArea } = Input;
const API_URL = 'https://67c5664dc4649b9551b680c7.mockapi.io/api/patient-reg/user';


function App(props) {
  const { form } = props;
  const { getFieldDecorator } = form;
  const [loading, setLoading ] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [ isEditing, setIsEditing] = useState(false);
  const [currentEmployeeId,  setCurrentEmployeeId] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setEmployees(response.data);
      localStorage.setItem('employees', JSON.stringify(response.data));
    } catch (error) {
      notification.error(
        {
        message: 'Error',
        description: 'Failed to fetch employees: ' + error.message
      }
    );
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeById = async (id) => {
    setLoading(true);
    try {
      setShowForm(true);
      setIsEditing(true);
      setCurrentEmployeeId(id);

      const response = await axios.get(`${API_URL}/${id}`);
      const userData = {
        ...response.data,
        birthDate: response.data.birthDate ? moment(response.data.birthDate) : null,
        hireDate: response.data.hireDate ? moment(response.data.hireDate) : null,
        performanceRating: response.data.performanceRating ? parseInt(response.data.performanceRating) : null
      };

      setTimeout(() => {
        form.setFieldsValue(userData);
      }, 100);
  
    } catch (error) {
      notification.error(
        {
        message: 'Error',
        description: 'Failed!' + error.message
      });
      
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    form.validateFields(async (error, values) => {
      if (!error) {
        setLoading(true);

        try {
          const formattedValues = {
            ...values,
            birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : null,
            hireDate: values.hireDate ? values.hireDate.format('YYYY-MM-DD') : null
          };

          let response;
          if (isEditing) {
            response = await axios.put(`${API_URL}/${currentEmployeeId}`, formattedValues);
            notification.success({
              message: 'Success',
              description: 'Employee updated successfully!'
            });
          } else {
            response = await axios.post(API_URL, formattedValues);
            notification.success({
              message: 'Success',
              description: 'Employee added sucessfully'
            });
          }

          form.resetFields();
          setIsEditing(false);
          setCurrentEmployeeId(null);
          setShowForm(false);

          fetchEmployees();
          

          const payload = {
            action: isEditing ? 'UPDATE' : 'CREATE',
            data: response.data,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('lastAction', JSON.stringify(payload));
          
          
        } catch (error) {
          notification.error({
            message: 'Error',
            description: `Failed to ${isEditing ? 'update' : 'add'} employee: ${error.message}`
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleDeleteEmployee = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`);
      notification.success({
        message: 'Success',
        description: 'Employee deleted successfuly'
      });
      
      fetchEmployees();
      
      const payload = {
        action: 'DELETE',
        employeeId: id,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('lastAction', JSON.stringify(payload));
      
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to delete employee: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsEditing(false);
    setCurrentEmployeeId(null);
    setShowForm(false);
  };

  useEffect(() => {
    const storedEmployees = localStorage.getItem('employees');
    if (storedEmployees) {
      setEmployees(JSON.parse(storedEmployees));
    }
    fetchEmployees();
  }, []);

  const columns = [
        {
          title: 'Avatar',
          dataIndex: 'avatar',
          key: 'avatar',
          render: (_, record) => (
            <Avatar 
              style={
                
                { 
                backgroundColor: '#1890ff' 
                }
              }
              size="large"
            >
              {
                  record.name ? record.name.charAt(0) : '?'
              }
            </Avatar>
          )
        },
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
          title: 'Email',
          dataIndex: 'email',
          key: 'email'
        },
      {
        title: 'Department',
        dataIndex: 'departmentId',
        key: 'departmentId',
        render: (text) => {
          const departments = {
            'hr': 'Human Resources',
            'it': 'Information Technology',
            'finance': 'Finance',
            'marketing': 'Marketing'
          };
          return departments[text] || text;
        }
      },
      {
        title: 'Employee Type',
        dataIndex: 'employeeType',
        key: 'employeeType',
        render: (text) => {
          const types = {
            'full-time': 'Full Time',
            'part-time': 'Part Time',
            'contract-basis': 'Contract',
            'internship': 'Intern'
          };
          return types[text] || text;
        }
      },
      {
        title: 'Status',
        dataIndex: 'active',
        key: 'active',
        render: (active) => active ? 'Active' : 'Inactive'
      },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <span>
          <Button 
                type="primary"  
                onClick={
                  () => fetchEmployeeById(record.id)
                
                    }
                >
            Edit
          </Button>
          <Button 
            type="danger" 
            style={
              { 
                marginLeft: 8 
              }
            }
            onClick={
              () => handleDeleteEmployee(record.id)
            }
          >
            Delete
          </Button>
        </span>
      )
    }
  ];

  return (  
    <Spin spinning={loading}>
      <div className="employee-mngmt">
        {!showForm && (
          <div className="employee-table">
            <div style={
            { 
                marginBottom: 16,  
                textAlign: 'right' 
                }
                }
                >
              <Button 
                type="primary" 
                onClick={() => setShowForm(true)}
              >
                Add Employee
              </Button>
            </div>
            
            <Table 
              dataSource={employees} 
              columns={columns} 
              rowKey="id"
              pagination={
                {   
                   pageSize: 10 

                }
              }
            />
          </div>
        )}
        {showForm && (
          <div className="employee-form">
            <h2>{isEditing ? 'Edit Employee' : 'Add New Employee'}</h2>
            <Form 
              layout="vertical" 
              onSubmit={handleSubmit} 
              id='employee-reg-form'
            >
              <Row gutter={16}>
                <Col 
                    sm={24} 
                    md={8} 
                      lg={6}
                >
                  <Form.Item label="Name">
                    {getFieldDecorator('name', {
                      rules: [
                        { 
                            required: true, 
                            message: 'Please enter name' 
                        },
                        { 
                          min: 4, 
                          message: 'Name must be more than 3 characters' 
                        }
                      ],
                    })(<Input placeholder="First Name" autoComplete='none' />)}
                  </Form.Item>
                </Col>
                <Col 
                    sm={24} 
                    md={8} 
                    lg={6}
                >
                  <Form.Item label="Email">
                    {getFieldDecorator('email', {
                      rules: [
                          { 
                            required: true, 
                            message: 'Please enter email' 
                          },
                          { 
                            type: 'email', 
                            message: 'Please enter a valid email' 
                          },
                      ],
                    })
                    (<Input placeholder="Email" autoComplete='none' />)}
                  </Form.Item>
                </Col>

                <Col 
                      sm={24} 
                      md={8} 
                      lg={6}
                    >
                  <Form.Item label="Phone Number">
                    {getFieldDecorator('phone', {
                      rules: [
                        { 
                          required: true, 
                          message: 'Please enter phone number' 
                        }
                      ],
                    })(<Input placeholder="Phone Number" />)}
                  </Form.Item>
                </Col>

                <Col 
                      sm={24} 
                      md={8} 
                      lg={6}
                  >
                  <Form.Item label="Department">
                    {getFieldDecorator('departmentId', {
                      rules: [
                          { 
                            required: true, 
                            message: 'Please select department' 
                          }
                      ],
                    })(
                      <Select placeholder="Select Department">
                        <Option value="hr">Human Resources</Option>
                        <Option value="it">Information Technology</Option>
                        <Option value="finance">Finance</Option>
                        <Option value="marketing">Marketing</Option>
                      </Select>
                    )}
                  </Form.Item>
                </Col>

                <Col sm={24} md={8} lg={6}>
                  <Form.Item label="Hire Date">
                    {getFieldDecorator('hireDate', {
                      rules: [
                        { 
                          required: true, 
                          message: 'Please select Hire date' 
                        }
                      ],
                    })(<DatePicker style={{ width: '100%' }} />)}
                  </Form.Item>
                </Col>
                
                <Col 
                      sm={24} 
                      md={8} 
                      lg={6}
                      >
                  <Form.Item label="Birth Date">
                    {getFieldDecorator('birthDate')
                      (<DatePicker style={{ width: '100%' }} />)}
                  </Form.Item>
                </Col>
                
                <Col 
                      sm={24} 
                      md={8} 
                      lg={6}
                      >
                  <Form.Item label="Active Status">
                    {getFieldDecorator('Active', {
                      valuePropName: 'checked',
                      initialValue: true,
                    })(<Switch />)}
                  </Form.Item>
                </Col>
                
                <Col 
                      sm={24} 
                      md={8} 
                      lg={6}
                      >
                  <Form.Item label="Employee Type">
                    {getFieldDecorator('employeeType', {
                      rules: [
                        { required: true, message: 'Please select employee type' }
                      ],
                    })(
                      <Select placeholder="Select Type">
                        <Option value="full-time">Full Time</Option>
                        <Option value="part-time">Part Time</Option>
                        <Option value="contract-basis">Contract</Option>
                        <Option value="internship">Intern</Option>
                      </Select>
                    )}
                  </Form.Item>
                </Col>
                
                <Col 
                      sm={24} 
                      md={8} 
                      lg={6}
                      >
                  <Form.Item label="Experience (Years)">
                    {getFieldDecorator('experience')
                    (<InputNumber min={0} max={50} style={{ width: '100%' }} />)}
                  </Form.Item>
                </Col>
                
                <Col 
                      sm={24} 
                      md={8} 
                      lg={6}
                    >
                  <Form.Item label="Performance Rating">
                    {getFieldDecorator('performanceRating')(
                      <Select placeholder="Rating">
                        <Option value={1}>1 - Poor</Option>
                        <Option value={2}>2 - Can Do Better</Option>
                        <Option value={3}>3 - Good</Option>
                        <Option value={4}>4 - Very Good</Option>
                        <Option value={5}>5 - Exceeds Expectations</Option>
                      </Select>
                    )}
                  </Form.Item>
                </Col>
            
                <Col span={24}>
                  <Form.Item label="Notes">
                    {getFieldDecorator('notes')
                    (<TextArea rows={4} placeholder="More Info about the employee" />)}
                  </Form.Item>
                </Col>
              </Row>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <div>
                  <Button type="primary" htmlType="submit">
                    {isEditing ? 'Update' : 'Submit'}
                  </Button>
                  <Button 
                        style={
                          { 
                            marginLeft: 8 
                            }
                      } onClick={
                        handleCancel
                  }>
                    Cancel
                  </Button>
                </div>
                {isEditing && (
                  <Button 
                        type="danger" 
                        onClick={
                          () => handleDeleteEmployee(currentEmployeeId)
                          }
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Form>
          </div>
        )}
      </div>
    </Spin>
  );
}

export const WrappedApp = Form.create(
  {
     name: 'form-task' 
  }
)(App);

export default WrappedApp;
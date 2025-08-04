import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import "./Schedule.css";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BlockBetween,
  Row,
  Col,
  Button,
  Icon,
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableItem,
  PaginationComponent,
  PreviewCard,
} from "@/components/Component";
import {
  Badge,
  Modal,
  ModalBody,
  ModalHeader,
  Form,
  FormGroup,
  Label,
  Input,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('1');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form state for new/edit schedule
  const [formData, setFormData] = useState({
    name: '',
    scanType: 'vulnerability',
    target: '',
    frequency: 'weekly',
    time: '02:00',
    timezone: 'UTC',
    enabled: true,
    template: '',
    targetGroup: '',
    notifications: true,
    maintenanceWindow: false,
    maintenanceStart: '',
    maintenanceEnd: ''
  });

  // Sample data - replace with API calls
  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/scanner/schedules', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedSchedules = data.data.schedules.map(schedule => ({
          id: schedule.id,
          name: schedule.name,
          scanType: schedule.scanType,
          frequency: schedule.frequency,
          nextRun: schedule.nextRunFormatted,
          target: schedule.target,
          template: schedule.configuration?.template || 'Default Template',
          status: schedule.enabled ? 'active' : 'paused',
          enabled: schedule.enabled,
          lastRun: schedule.lastRunFormatted,
          actions: ['pause', 'edit', 'delete']
        }));
        setSchedules(formattedSchedules);
      } else {
        console.error('Failed to load schedules');
        // Fallback to sample data
        setSchedules([
          {
            id: 1,
            name: 'Weekly Security Scan',
            scanType: 'vulnerability',
            frequency: 'Weekly',
            nextRun: 'Apr 10, 2025 - 05:00 AM',
            target: 'Web Servers',
            template: 'Quick Vulnerability Scan',
            status: 'active',
            enabled: true,
            lastRun: 'Apr 03, 2025 - 05:00 AM',
            actions: ['pause', 'edit', 'delete']
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
      // Fallback to sample data
      setSchedules([
        {
          id: 1,
          name: 'Weekly Security Scan',
          scanType: 'vulnerability',
          frequency: 'Weekly',
          nextRun: 'Apr 10, 2025 - 05:00 AM',
          target: 'Web Servers',
          template: 'Quick Vulnerability Scan',
          status: 'active',
          enabled: true,
          lastRun: 'Apr 03, 2025 - 05:00 AM',
          actions: ['pause', 'edit', 'delete']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleModal = () => setModal(!modal);
  const toggleEditModal = () => setEditModal(!editModal);
  const toggleTab = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert frequency and time to cron expression
      const cronExpression = convertToCron(formData.frequency, formData.time);

      const scheduleData = {
        name: formData.name,
        description: `${formData.scanType} scan for ${formData.targetGroup}`,
        scanType: formData.scanType,
        target: formData.targetGroup,
        configuration: {
          template: formData.template,
          notifications: formData.notifications,
          timezone: formData.timezone
        },
        schedule: cronExpression,
        enabled: formData.enabled
      };

      const response = await fetch('/api/v1/scanner/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(scheduleData)
      });

      if (response.ok) {
        await response.json();
        // Reload schedules to get updated list
        await loadSchedules();

        setFormData({
          name: '',
          scanType: 'vulnerability',
          target: '',
          frequency: 'weekly',
          time: '02:00',
          timezone: 'UTC',
          enabled: true,
          template: '',
          targetGroup: '',
          notifications: true,
          maintenanceWindow: false,
          maintenanceStart: '',
          maintenanceEnd: ''
        });
        toggleModal();
      } else {
        const errorData = await response.json();
        console.error('Error creating schedule:', errorData);
        alert('Failed to create schedule: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule: ' + error.message);
    }
  };

  // Helper function to convert frequency and time to cron expression
  const convertToCron = (frequency, time) => {
    const [hour, minute] = time.split(':');

    switch (frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        return `${minute} ${hour} * * 0`; // Sunday
      case 'monthly':
        return `${minute} ${hour} 1 * *`; // First day of month
      case 'quarterly':
        return `${minute} ${hour} 1 */3 *`; // First day of every 3rd month
      default:
        return `${minute} ${hour} * * *`; // Default to daily
    }
  };

  const handleEdit = (schedule) => {
    setFormData({
      name: schedule.name,
      scanType: schedule.scanType,
      target: schedule.target,
      frequency: schedule.frequency.toLowerCase(),
      time: '02:00',
      timezone: 'UTC',
      enabled: schedule.enabled,
      template: schedule.template,
      targetGroup: schedule.target,
      notifications: true,
      maintenanceWindow: false,
      maintenanceStart: '',
      maintenanceEnd: ''
    });
    toggleEditModal();
  };

  const handleDelete = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        const response = await fetch(`/api/v1/scanner/schedules/${scheduleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          setSchedules(prev => prev.filter(s => s.id !== scheduleId));
        } else {
          const errorData = await response.json();
          console.error('Error deleting schedule:', errorData);
          alert('Failed to delete schedule: ' + (errorData.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Failed to delete schedule: ' + error.message);
      }
    }
  };

  const handleToggleStatus = async (scheduleId) => {
    try {
      const schedule = schedules.find(s => s.id === scheduleId);
      const response = await fetch(`/api/v1/scanner/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          enabled: !schedule.enabled
        })
      });

      if (response.ok) {
        setSchedules(prev => prev.map(s =>
          s.id === scheduleId
            ? { ...s, enabled: !s.enabled, status: s.enabled ? 'paused' : 'active' }
            : s
        ));
      } else {
        const errorData = await response.json();
        console.error('Error toggling schedule status:', errorData);
        alert('Failed to update schedule: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error toggling schedule status:', error);
      alert('Failed to update schedule: ' + error.message);
    }
  };

  const getStatusBadge = (status, enabled) => {
    if (!enabled || status === 'paused') {
      return <Badge color="warning">Paused</Badge>;
    }
    return <Badge color="success">Active</Badge>;
  };

  const getScanTypeIcon = (scanType) => {
    const icons = {
      'vuln-scan': 'shield-check',
      'compliance-scan': 'check-circle',
      'port-scan': 'activity',
      'comprehensive-scan': 'eye',
      'web-scan': 'globe'
    };
    return icons[scanType] || 'scan';
  };

  // Pagination
  const indexOfLastItem = currentPage * itemPerPage;
  const indexOfFirstItem = indexOfLastItem - itemPerPage;
  const currentItems = schedules.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(schedules.length / itemPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calendar functionality
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Previous month days
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      calendar.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        hasSchedule: false
      });
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = year === today.getFullYear() &&
                     month === today.getMonth() &&
                     day === today.getDate();

      calendar.push({
        day,
        isCurrentMonth: true,
        isToday,
        hasSchedule: day === 1 || day === 8 || day === 15 || day === 22 // Sample scheduled days
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - calendar.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      calendar.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        hasSchedule: false
      });
    }

    return {
      calendar,
      monthName: monthNames[month],
      year
    };
  };

  const { calendar, monthName, year } = generateCalendar();

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  return (
    <React.Fragment>
      <Head title="Scan Schedule" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Scan Schedule</BlockTitle>
              <BlockDes className="text-soft">
                Manage recurring vulnerability scans
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <Button
                  className="btn-icon btn-trigger toggle-expand me-n1"
                  color="transparent"
                >
                  <Icon name="menu-alt-r"></Icon>
                </Button>
                <div className="toggle-expand-content">
                  <ul className="nk-block-tools g-3">
                    <li>
                      <Button color="primary" onClick={toggleModal}>
                        <Icon name="plus" />
                        <span>Schedule New Scan</span>
                      </Button>
                    </li>
                    <li>
                      <Button color="info" onClick={() => setActiveTab('2')}>
                        <Icon name="calendar" />
                        <span>View Calendar</span>
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* Main Content Tabs */}
        <Block>
          <Nav tabs>
            <NavItem>
              <NavLink
                className={activeTab === '1' ? 'active' : ''}
                onClick={() => toggleTab('1')}
                style={{ cursor: 'pointer' }}
              >
                <Icon name="list" className="me-1" />
                Scheduled Scans
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === '2' ? 'active' : ''}
                onClick={() => toggleTab('2')}
                style={{ cursor: 'pointer' }}
              >
                <Icon name="calendar" className="me-1" />
                Calendar
              </NavLink>
            </NavItem>
          </Nav>

          <TabContent activeTab={activeTab}>
            {/* Scheduled Scans Tab */}
            <TabPane tabId="1">
              <PreviewCard>
                <div className="card-inner">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className="mb-0">Scheduled Scans</h6>
                    <div className="d-flex align-items-center gap-2">
                      <Badge color="light" className="text-soft">
                        {schedules.length} Total Schedules
                      </Badge>
                      <Badge color="success">
                        {schedules.filter(s => s.enabled).length} Active
                      </Badge>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <DataTable className="card-stretch">
                        <DataTableHead className="nk-tb-head">
                          <DataTableRow>
                            <DataTableItem tag="th">
                              <span className="sub-text">Name</span>
                            </DataTableItem>
                            <DataTableItem tag="th">
                              <span className="sub-text">Frequency</span>
                            </DataTableItem>
                            <DataTableItem tag="th">
                              <span className="sub-text">Next Run</span>
                            </DataTableItem>
                            <DataTableItem tag="th">
                              <span className="sub-text">Target Group</span>
                            </DataTableItem>
                            <DataTableItem tag="th">
                              <span className="sub-text">Template</span>
                            </DataTableItem>
                            <DataTableItem tag="th">
                              <span className="sub-text">Status</span>
                            </DataTableItem>
                            <DataTableItem tag="th" className="nk-tb-col-tools text-end">
                              <span className="sub-text">Actions</span>
                            </DataTableItem>
                          </DataTableRow>
                        </DataTableHead>
                        <DataTableBody>
                          {currentItems.map((schedule) => (
                            <DataTableRow key={schedule.id}>
                              <DataTableItem>
                                <div className="d-flex align-items-center">
                                  <div className="icon-circle icon-circle-sm bg-primary-dim me-2">
                                    <Icon name={getScanTypeIcon(schedule.scanType)} className="text-primary" />
                                  </div>
                                  <div>
                                    <span className="fw-medium">{schedule.name}</span>
                                    <div className="small text-soft">{schedule.scanType}</div>
                                  </div>
                                </div>
                              </DataTableItem>
                              <DataTableItem>
                                <span className="tb-amount">{schedule.frequency}</span>
                              </DataTableItem>
                              <DataTableItem>
                                <span className="tb-amount">{schedule.nextRun}</span>
                              </DataTableItem>
                              <DataTableItem>
                                <span className="tb-amount">{schedule.target}</span>
                              </DataTableItem>
                              <DataTableItem>
                                <span className="tb-amount">{schedule.template}</span>
                              </DataTableItem>
                              <DataTableItem>
                                {getStatusBadge(schedule.status, schedule.enabled)}
                              </DataTableItem>
                              <DataTableItem className="nk-tb-col-tools">
                                <ul className="nk-tb-actions gx-1">
                                  <li>
                                    <UncontrolledDropdown>
                                      <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
                                        <Icon name="more-h"></Icon>
                                      </DropdownToggle>
                                      <DropdownMenu end>
                                        <ul className="link-list-opt no-bdr">
                                          <li>
                                            <DropdownItem
                                              tag="a"
                                              href="#toggle"
                                              onClick={(ev) => {
                                                ev.preventDefault();
                                                handleToggleStatus(schedule.id);
                                              }}
                                            >
                                              <Icon name={schedule.enabled ? "pause" : "play"}></Icon>
                                              <span>{schedule.enabled ? "Pause" : "Resume"}</span>
                                            </DropdownItem>
                                          </li>
                                          <li>
                                            <DropdownItem
                                              tag="a"
                                              href="#edit"
                                              onClick={(ev) => {
                                                ev.preventDefault();
                                                handleEdit(schedule);
                                              }}
                                            >
                                              <Icon name="edit"></Icon>
                                              <span>Edit</span>
                                            </DropdownItem>
                                          </li>
                                          <li>
                                            <DropdownItem
                                              tag="a"
                                              href="#delete"
                                              onClick={(ev) => {
                                                ev.preventDefault();
                                                handleDelete(schedule.id);
                                              }}
                                            >
                                              <Icon name="trash"></Icon>
                                              <span>Delete</span>
                                            </DropdownItem>
                                          </li>
                                        </ul>
                                      </DropdownMenu>
                                    </UncontrolledDropdown>
                                  </li>
                                </ul>
                              </DataTableItem>
                            </DataTableRow>
                          ))}
                        </DataTableBody>
                      </DataTable>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="card-inner">
                          <PaginationComponent
                            itemPerPage={itemPerPage}
                            totalItems={schedules.length}
                            paginate={paginate}
                            currentPage={currentPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </PreviewCard>
            </TabPane>

            {/* Calendar Tab */}
            <TabPane tabId="2">
              <Row className="g-gs">
                <Col lg="8">
                  <PreviewCard>
                    <div className="card-inner">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h6 className="mb-0">Calendar</h6>
                        <div className="d-flex align-items-center gap-2">
                          <Button size="sm" color="light" onClick={() => navigateMonth(-1)}>
                            <Icon name="chevron-left" />
                          </Button>
                          <span className="fw-medium">{monthName} {year}</span>
                          <Button size="sm" color="light" onClick={() => navigateMonth(1)}>
                            <Icon name="chevron-right" />
                          </Button>
                        </div>
                      </div>

                      {/* Calendar Grid */}
                      <div className="calendar-grid">
                        <div className="calendar-header">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="calendar-day-header">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="calendar-body">
                          {calendar.map((date, index) => (
                            <div
                              key={index}
                              className={`calendar-day ${!date.isCurrentMonth ? 'other-month' : ''} ${date.isToday ? 'today' : ''} ${date.hasSchedule ? 'has-schedule' : ''}`}
                            >
                              <span className="day-number">{date.day}</span>
                              {date.hasSchedule && (
                                <div className="schedule-indicator">
                                  <div className="schedule-dot bg-primary"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </PreviewCard>
                </Col>
                <Col lg="4">
                  <PreviewCard>
                    <div className="card-inner">
                      <h6 className="mb-3">Frequency Colors</h6>
                      <div className="d-flex align-items-center mb-2">
                        <div className="schedule-dot bg-success me-2"></div>
                        <span className="small">Daily</span>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <div className="schedule-dot bg-primary me-2"></div>
                        <span className="small">Weekly</span>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <div className="schedule-dot bg-warning me-2"></div>
                        <span className="small">Monthly</span>
                      </div>
                      <div className="d-flex align-items-center mb-4">
                        <div className="schedule-dot bg-info me-2"></div>
                        <span className="small">Quarterly</span>
                      </div>

                      <h6 className="mb-3">Scheduled for 5/18/2025</h6>
                      <p className="text-soft small">No scans scheduled for this date</p>
                    </div>
                  </PreviewCard>
                </Col>
              </Row>
            </TabPane>
          </TabContent>
        </Block>

        {/* New Schedule Modal */}
        <Modal isOpen={modal} toggle={toggleModal} size="lg">
          <ModalHeader toggle={toggleModal}>Schedule New Scan</ModalHeader>
          <ModalBody>
            <Form onSubmit={handleSubmit}>
              <Row className="g-3">
                <Col md="6">
                  <FormGroup>
                    <Label htmlFor="name">Schedule Name</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter schedule name"
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label htmlFor="scanType">Scan Type</Label>
                    <Input
                      type="select"
                      id="scanType"
                      name="scanType"
                      value={formData.scanType}
                      onChange={handleInputChange}
                    >
                      <option value="vulnerability">Vulnerability Scan</option>
                      <option value="compliance">Compliance Scan</option>
                      <option value="internal">Internal Network Scan</option>
                      <option value="web">Web Application Scan</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label htmlFor="targetGroup">Target Group</Label>
                    <Input
                      type="select"
                      id="targetGroup"
                      name="targetGroup"
                      value={formData.targetGroup}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select target group</option>
                      <option value="Web Servers">Web Servers</option>
                      <option value="Database Servers">Database Servers</option>
                      <option value="Critical Infrastructure">Critical Infrastructure</option>
                      <option value="All Assets">All Assets</option>
                      <option value="Development Environment">Development Environment</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label htmlFor="template">Template</Label>
                    <Input
                      type="select"
                      id="template"
                      name="template"
                      value={formData.template}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select template</option>
                      <option value="Quick Vulnerability Scan">Quick Vulnerability Scan</option>
                      <option value="Comprehensive Security Scan">Comprehensive Security Scan</option>
                      <option value="Compliance Audit">Compliance Audit</option>
                      <option value="Network Discovery">Network Discovery</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Input
                      type="select"
                      id="frequency"
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleInputChange}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      type="select"
                      id="timezone"
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">EST</option>
                      <option value="PST">PST</option>
                      <option value="CST">CST</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="12">
                  <div className="form-check">
                    <Input
                      type="checkbox"
                      id="enabled"
                      name="enabled"
                      checked={formData.enabled}
                      onChange={handleInputChange}
                      className="form-check-input"
                    />
                    <Label htmlFor="enabled" className="form-check-label">
                      Enable schedule immediately
                    </Label>
                  </div>
                </Col>
                <Col md="12">
                  <div className="form-check">
                    <Input
                      type="checkbox"
                      id="notifications"
                      name="notifications"
                      checked={formData.notifications}
                      onChange={handleInputChange}
                      className="form-check-input"
                    />
                    <Label htmlFor="notifications" className="form-check-label">
                      Send notifications when scan completes
                    </Label>
                  </div>
                </Col>
              </Row>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button type="button" color="light" onClick={toggleModal}>
                  Cancel
                </Button>
                <Button type="submit" color="primary">
                  Create Schedule
                </Button>
              </div>
            </Form>
          </ModalBody>
        </Modal>

        {/* Edit Schedule Modal */}
        <Modal isOpen={editModal} toggle={toggleEditModal} size="lg">
          <ModalHeader toggle={toggleEditModal}>Edit Schedule</ModalHeader>
          <ModalBody>
            <Form onSubmit={handleSubmit}>
              {/* Same form fields as create modal */}
              <Row className="g-3">
                <Col md="6">
                  <FormGroup>
                    <Label htmlFor="edit-name">Schedule Name</Label>
                    <Input
                      type="text"
                      id="edit-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter schedule name"
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label htmlFor="edit-scanType">Scan Type</Label>
                    <Input
                      type="select"
                      id="edit-scanType"
                      name="scanType"
                      value={formData.scanType}
                      onChange={handleInputChange}
                    >
                      <option value="vulnerability">Vulnerability Scan</option>
                      <option value="compliance">Compliance Scan</option>
                      <option value="internal">Internal Network Scan</option>
                      <option value="web">Web Application Scan</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button type="button" color="light" onClick={toggleEditModal}>
                  Cancel
                </Button>
                <Button type="submit" color="primary">
                  Update Schedule
                </Button>
              </div>
            </Form>
          </ModalBody>
        </Modal>
      </Content>
    </React.Fragment>
  );
};

export default Schedule;
